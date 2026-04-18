import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ActivityFeed from './ActivityFeed'

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('../api/axiosClient', () => ({
  default: { get: vi.fn() },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../utils/dateUtils', () => ({
  formatTimeAgo: (ts) => (ts ? 'just now' : ''),
}))

import axiosClient from '../api/axiosClient'

// ─── helpers ─────────────────────────────────────────────────────────────────

const SAMPLE_ACTIVITIES = [
  {
    id: 1,
    groupId: 'g1',
    sectionId: 10,
    actorName: 'Alice Smith',
    actionType: 'EXPENSE_ADDED',
    entityName: 'Pizza',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    groupId: 'g1',
    sectionId: null,
    actorName: 'Bob Jones',
    actionType: 'MEMBER_JOINED',
    entityName: null,
    createdAt: new Date().toISOString(),
  },
]

function renderFeed() {
  return render(
    <MemoryRouter>
      <ActivityFeed />
    </MemoryRouter>
  )
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ActivityFeed – rendering', () => {
  it('renders the history toggle button', () => {
    renderFeed()
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
  })

  it('does not show dropdown before button is clicked', () => {
    renderFeed()
    expect(screen.queryByText('Recent activity')).not.toBeInTheDocument()
  })
})

describe('ActivityFeed – open / close', () => {
  it('shows dropdown header after clicking the toggle button', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    expect(screen.getByText('Recent activity')).toBeInTheDocument()
  })

  it('hides dropdown when toggle button is clicked again', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })
    renderFeed()

    const btn = screen.getByRole('button', { name: /activity/i })

    await act(async () => { fireEvent.click(btn) })
    await act(async () => { fireEvent.click(btn) })

    expect(screen.queryByText('Recent activity')).not.toBeInTheDocument()
  })
})

describe('ActivityFeed – data fetching', () => {
  it('calls /activity/recent when opened', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    expect(axiosClient.get).toHaveBeenCalledWith('/activity/recent', expect.objectContaining({ params: expect.any(Object) }))
  })

  it('shows "No recent activity" when API returns empty list', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('No recent activity.')).toBeInTheDocument()
    )
  })

  it('shows "No recent activity" when API fails', async () => {
    axiosClient.get.mockRejectedValue(new Error('Network error'))
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('No recent activity.')).toBeInTheDocument()
    )
  })

  it('renders activity entries when API returns data', async () => {
    axiosClient.get.mockResolvedValue({ data: SAMPLE_ACTIVITIES })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })
  })

  it('shows formatted action text for entries with entity name', async () => {
    axiosClient.get.mockResolvedValue({ data: SAMPLE_ACTIVITIES })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() =>
      expect(screen.getByText(/added expense "Pizza"/i)).toBeInTheDocument()
    )
  })
})

describe('ActivityFeed – navigation', () => {
  it('navigates to group+section when entry with sectionId is clicked on desktop', async () => {
    axiosClient.get.mockResolvedValue({ data: [SAMPLE_ACTIVITIES[0]] })

    // Simulate desktop (width >= 768)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })

    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() => screen.getByText('Alice Smith'))

    fireEvent.click(screen.getByText('Alice Smith').closest('button'))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/groups/g1')
    )
  })

  it('navigates to group only when entry has no sectionId', async () => {
    const noSection = { ...SAMPLE_ACTIVITIES[1] } // MEMBER_JOINED, sectionId: null
    axiosClient.get.mockResolvedValue({ data: [noSection] })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() => screen.getByText('Bob Jones'))

    fireEvent.click(screen.getByText('Bob Jones').closest('button'))

    expect(mockNavigate).toHaveBeenCalledWith('/groups/g1')
  })
})

describe('ActivityFeed – view all link', () => {
  it('renders "View all" link pointing to /activity', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })
    renderFeed()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /activity/i }))
    })

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /view all/i })
      expect(link).toHaveAttribute('href', '/activity')
    })
  })
})
