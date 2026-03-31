import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ─── helpers ─────────────────────────────────────────────────────────────────

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  )
}

function fillForm({ firstName = 'Jane', lastName = 'Doe', email = 'jane@example.com', password = 'pass1234' } = {}) {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: firstName } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: lastName } })
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } })
  const pwInput = document.querySelector('input[type="password"]')
  fireEvent.change(pwInput, { target: { value: password } })
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Register – rendering', () => {
  it('renders all required form fields', () => {
    renderRegister()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders a link to the login page', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Register – password validation', () => {
  it('shows an error toast and does not call register when password is too short', async () => {
    const { toast } = await import('react-toastify')
    renderRegister()
    fillForm({ password: 'short' })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows an error toast when password is empty', async () => {
    const { toast } = await import('react-toastify')
    renderRegister()
    fillForm({ password: '' })

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /sign up/i }).closest('form'))
    })

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters')
    expect(mockRegister).not.toHaveBeenCalled()
  })
})

describe('Register – form submission', () => {
  it('calls register with the correct arguments', async () => {
    mockRegister.mockResolvedValue()
    renderRegister()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(mockRegister).toHaveBeenCalledWith('Jane', 'Doe', 'jane@example.com', 'pass1234')
  })

  it('navigates to /login after successful registration', async () => {
    mockRegister.mockResolvedValue()
    renderRegister()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows a success toast after successful registration', async () => {
    const { toast } = await import('react-toastify')
    mockRegister.mockResolvedValue()
    renderRegister()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(toast.success).toHaveBeenCalledWith('Registration successful! Please login.')
  })

  it('shows the API error message when registration fails with a response', async () => {
    const { toast } = await import('react-toastify')
    const apiError = { response: { data: { message: 'Email already taken' } } }
    mockRegister.mockRejectedValue(apiError)
    renderRegister()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(toast.error).toHaveBeenCalledWith('Email already taken')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('falls back to a generic error message when the error has no response body', async () => {
    const { toast } = await import('react-toastify')
    mockRegister.mockRejectedValue(new Error('Network error'))
    renderRegister()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    expect(toast.error).toHaveBeenCalledWith('Registration failed. Please try again.')
  })
})
