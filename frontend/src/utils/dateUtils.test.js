import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parseUTCDate, formatTimeAgo } from './dateUtils'

describe('parseUTCDate', () => {
  it('returns null for null input', () => {
    expect(parseUTCDate(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseUTCDate(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseUTCDate('')).toBeNull()
  })

  it('returns null for an unparseable string', () => {
    expect(parseUTCDate('not-a-date')).toBeNull()
  })

  it('parses a bare LocalDateTime string (no timezone) as a valid Date', () => {
    const result = parseUTCDate('2025-01-15T10:30:00')
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).not.toBeNaN()
    // Parsed as local time — hour depends on test runner timezone, so only validate it's a real Date
  })

  it('passes through a Date object unchanged', () => {
    const d = new Date('2025-01-15T10:30:00Z')
    expect(parseUTCDate(d)).toBe(d)
  })

  it('returns null for an invalid Date object', () => {
    expect(parseUTCDate(new Date('not-a-date'))).toBeNull()
  })

  it('handles timestamp that already ends with Z', () => {
    const result = parseUTCDate('2025-01-15T10:30:00Z')
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2025-01-15T10:30:00.000Z')
  })

  it('handles ISO timestamp with explicit UTC offset', () => {
    const result = parseUTCDate('2025-01-15T10:30:00+00:00')
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2025-01-15T10:30:00.000Z')
  })
})

describe('formatTimeAgo', () => {
  const NOW = new Date('2025-06-01T12:00:00Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty string for null', () => {
    expect(formatTimeAgo(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatTimeAgo(undefined)).toBe('')
  })

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    const ts = new Date(NOW - 30_000).toISOString().replace('Z', '')
    expect(formatTimeAgo(ts)).toBe('just now')
  })

  it('returns minutes ago for timestamps under 1 hour', () => {
    const ts = new Date(NOW - 5 * 60_000).toISOString().replace('Z', '')
    expect(formatTimeAgo(ts)).toBe('5m ago')
  })

  it('returns hours ago for timestamps under 24 hours', () => {
    const ts = new Date(NOW - 3 * 3_600_000).toISOString().replace('Z', '')
    expect(formatTimeAgo(ts)).toBe('3h ago')
  })

  it('returns days ago for timestamps under 7 days', () => {
    const ts = new Date(NOW - 2 * 86_400_000).toISOString().replace('Z', '')
    expect(formatTimeAgo(ts)).toBe('2d ago')
  })

  it('returns a locale date string for timestamps older than 7 days', () => {
    const oldDate = new Date(NOW - 10 * 86_400_000)
    const ts = oldDate.toISOString().replace('Z', '')
    const result = formatTimeAgo(ts)
    // Should not return one of the relative formats
    expect(result).not.toMatch(/ago|just now/)
    // Should be a non-empty string (toLocaleDateString result)
    expect(result.length).toBeGreaterThan(0)
  })
})
