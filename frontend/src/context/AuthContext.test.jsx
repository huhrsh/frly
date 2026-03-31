import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// ─── module mocks ────────────────────────────────────────────────────────────

vi.mock('../api/axiosClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ─── test consumer ───────────────────────────────────────────────────────────

function AuthConsumer() {
  const { user, loading, login, logout, register, updateUser } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      {/* Errors are swallowed in the consumer; callers handle them */}
      <button
        onClick={async () => { try { await login('test@example.com', 'password123') } catch {} }}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button
        onClick={async () => { try { await register('Jane', 'Doe', 'jane@example.com', 'pass1234') } catch {} }}
        data-testid="register-btn"
      >
        Register
      </button>
      <button
        onClick={() => updateUser({ firstName: 'Updated' })}
        data-testid="update-btn"
      >
        Update
      </button>
    </div>
  )
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function waitForAuthReady() {
  // AuthProvider renders children only after loading=false (useEffect fires)
  await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('AuthProvider – initial state', () => {
  it('renders with no user when localStorage is empty', async () => {
    renderWithAuth()
    await waitForAuthReady()
    expect(screen.getByTestId('user-email').textContent).toBe('none')
  })

  it('restores user from localStorage on mount', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify({ email: 'restored@example.com' }))

    renderWithAuth()
    await waitForAuthReady()

    expect(screen.getByTestId('user-email').textContent).toBe('restored@example.com')
  })
})

describe('login()', () => {
  it('stores token and user in localStorage on success', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    axiosClient.post.mockResolvedValue({
      data: {
        accessToken: 'my-jwt',
        userDto: { email: 'test@example.com', firstName: 'Test' },
      },
    })

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    expect(localStorage.getItem('token')).toBe('my-jwt')
    const stored = JSON.parse(localStorage.getItem('user'))
    expect(stored.email).toBe('test@example.com')
  })

  it('exposes the logged-in user via context after login', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    axiosClient.post.mockResolvedValue({
      data: {
        accessToken: 'my-jwt',
        userDto: { email: 'test@example.com' },
      },
    })

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('user-email').textContent).toBe('test@example.com')
    )
  })

  it('does not store a token when the request fails', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    axiosClient.post.mockRejectedValue(new Error('Network error'))

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    // After a failed login, no token should be persisted
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('logout()', () => {
  it('clears all auth-related localStorage keys', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('user', JSON.stringify({ email: 'user@example.com' }))
    localStorage.setItem('currentGroupId', '5')
    localStorage.setItem('fontPreference', 'large')

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('currentGroupId')).toBeNull()
    expect(localStorage.getItem('fontPreference')).toBeNull()
  })

  it('sets user to null after logout', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('user', JSON.stringify({ email: 'user@example.com' }))

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(screen.getByTestId('user-email').textContent).toBe('none')
  })
})

describe('register()', () => {
  it('calls the correct API endpoint', async () => {
    const axiosClient = (await import('../api/axiosClient')).default
    axiosClient.post.mockResolvedValue({ data: {} })

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('register-btn').click()
    })

    expect(axiosClient.post).toHaveBeenCalledWith('/users', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'pass1234',
    })
  })
})

describe('updateUser()', () => {
  it('merges partial update into existing user state', async () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify({ email: 'u@example.com', firstName: 'Old' }))

    renderWithAuth()
    await waitForAuthReady()

    await act(async () => {
      screen.getByTestId('update-btn').click()
    })

    const stored = JSON.parse(localStorage.getItem('user'))
    expect(stored.firstName).toBe('Updated')
    expect(stored.email).toBe('u@example.com') // original field preserved
  })
})
