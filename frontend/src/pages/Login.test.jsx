import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button data-testid="google-login" onClick={() => onSuccess({ credential: 'mock-token' })}>Continue with Google</button>
  ),
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('../api/axiosClient', () => ({
  default: { post: vi.fn() },
}))

// ─── helpers ─────────────────────────────────────────────────────────────────

function renderLogin(locationState = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: locationState }]}>
      <Login />
    </MemoryRouter>
  )
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

describe('Login – rendering', () => {
  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    // PasswordInput wraps the input — find by role
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows session-expired toast when authExpired flag is set', async () => {
    const { toast } = await import('react-toastify')
    sessionStorage.setItem('authExpired', '1')
    renderLogin()
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        'Your session has expired. Please sign in again.'
      )
    )
    expect(sessionStorage.getItem('authExpired')).toBeNull()
  })
})

describe('Login – form submission', () => {
  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValue()
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    // PasswordInput renders a regular <input type="password"> inside it
    const pwInput = document.querySelector('input[type="password"]')
    fireEvent.change(pwInput, { target: { value: 'secret123' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    })

    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123')
  })

  it('navigates to /dashboard after successful login', async () => {
    mockLogin.mockResolvedValue()
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    const pwInput = document.querySelector('input[type="password"]')
    fireEvent.change(pwInput, { target: { value: 'secret123' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('navigates to the original destination when redirected from a protected route', async () => {
    mockLogin.mockResolvedValue()
    renderLogin({ from: { pathname: '/groups/42' } })

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    const pwInput = document.querySelector('input[type="password"]')
    fireEvent.change(pwInput, { target: { value: 'secret123' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/groups/42', { replace: true })
  })

  it('shows an error toast when login fails', async () => {
    const { toast } = await import('react-toastify')
    mockLogin.mockRejectedValue(new Error('bad credentials'))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    const pwInput = document.querySelector('input[type="password"]')
    fireEvent.change(pwInput, { target: { value: 'wrongpass' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Login failed. Please check your credentials.'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows an error toast when password is empty', async () => {
    const { toast } = await import('react-toastify')
    renderLogin()

    // Leave password blank, fill email only
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'))
    })

    expect(toast.error).toHaveBeenCalledWith('Please enter your password')
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

describe('Login – forgot password', () => {
  it('shows an info toast when "Forgot password?" is clicked with no email', async () => {
    const { toast } = await import('react-toastify')
    renderLogin()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    })

    expect(toast.info).toHaveBeenCalledWith('Please enter your email first.')
  })

  it('calls the forgot-password endpoint when email is filled', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    const { toast } = await import('react-toastify')
    axiosClient.post.mockResolvedValue({})
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    })

    expect(axiosClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'user@example.com',
    })
    expect(toast.success).toHaveBeenCalledWith(
      'If an account exists, a reset email has been sent.'
    )
  })

  it('shows an error toast when the forgot-password request fails', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    const { toast } = await import('react-toastify')
    axiosClient.post.mockRejectedValue(new Error('Network error'))
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to send reset email. Please try again later.'
    )
  })
})
