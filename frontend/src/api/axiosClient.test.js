import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axiosClient from './axiosClient'

// ─── extract interceptor handlers ────────────────────────────────────────────
// Interceptors are registered at module load time; we grab them via forEach
// so we can call the handlers directly without making real HTTP requests.

let reqFulfilled
axiosClient.interceptors.request.forEach(({ fulfilled }) => {
  reqFulfilled = fulfilled
})

let resRejected
axiosClient.interceptors.response.forEach(({ rejected }) => {
  resRejected = rejected
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeError(status, url) {
  return {
    response: { status },
    config: { url },
  }
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('axiosClient request interceptor', () => {
  it('attaches Bearer token from localStorage when present', () => {
    localStorage.setItem('token', 'my-jwt')
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers.Authorization).toBe('Bearer my-jwt')
  })

  it('does not attach Authorization header when token is absent', () => {
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers.Authorization).toBeUndefined()
  })

  it('does not attach Authorization header when token is the string "undefined"', () => {
    localStorage.setItem('token', 'undefined')
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers.Authorization).toBeUndefined()
  })

  it('attaches X-Group-ID header when currentGroupId is in localStorage', () => {
    localStorage.setItem('currentGroupId', '42')
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers['X-Group-ID']).toBe('42')
  })

  it('does not attach X-Group-ID when currentGroupId is absent', () => {
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers['X-Group-ID']).toBeUndefined()
  })

  it('attaches both headers when both values are in localStorage', () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('currentGroupId', '7')
    const config = { headers: {} }

    const result = reqFulfilled(config)

    expect(result.headers.Authorization).toBe('Bearer tok')
    expect(result.headers['X-Group-ID']).toBe('7')
  })
})

describe('axiosClient response interceptor – 401 on non-auth endpoints', () => {
  it('clears token, user and currentGroupId from localStorage', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('user', JSON.stringify({ email: 'u@example.com' }))
    localStorage.setItem('currentGroupId', '5')

    await resRejected(makeError(401, '/sections/1')).catch(() => {})

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('currentGroupId')).toBeNull()
  })

  it('sets the authExpired flag in sessionStorage', async () => {
    await resRejected(makeError(401, '/groups')).catch(() => {})

    expect(sessionStorage.getItem('authExpired')).toBe('1')
  })

  it('re-rejects the error so callers can still handle it', async () => {
    const error = makeError(401, '/sections/1')

    await expect(resRejected(error)).rejects.toEqual(error)
  })
})

describe('axiosClient response interceptor – 401 on /auth/ endpoints', () => {
  it('does NOT clear localStorage when the 401 comes from an auth endpoint', async () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify({ email: 'u@example.com' }))

    await resRejected(makeError(401, '/auth/login')).catch(() => {})

    // Auth data must be preserved — wrong credentials shouldn't force a logout
    expect(localStorage.getItem('token')).toBe('tok')
    expect(localStorage.getItem('user')).not.toBeNull()
  })

  it('does NOT set authExpired flag for auth endpoint 401s', async () => {
    await resRejected(makeError(401, '/auth/forgot-password')).catch(() => {})

    expect(sessionStorage.getItem('authExpired')).toBeNull()
  })
})

describe('axiosClient response interceptor – non-401 errors', () => {
  it('does not touch localStorage on a 403 error', async () => {
    localStorage.setItem('token', 'tok')

    await resRejected(makeError(403, '/sections/1')).catch(() => {})

    expect(localStorage.getItem('token')).toBe('tok')
  })

  it('does not touch localStorage on a 500 error', async () => {
    localStorage.setItem('token', 'tok')

    await resRejected(makeError(500, '/sections/1')).catch(() => {})

    expect(localStorage.getItem('token')).toBe('tok')
  })
})
