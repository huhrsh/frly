import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ActivityPage from './ActivityPage'

// ─── mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
const mockSubscribe = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

vi.mock('../hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    isSupported: true,
    isSubscribed: false,
    permission: 'default',
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}))

vi.mock('../utils/dateUtils', () => ({
  formatTimeAgo: () => 'just now',
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
]

const SAMPLE_NOTIFICATIONS = [
  {
    id: 101,
    type: 'GROUP_JOIN_APPROVED',
    title: 'Group join approved',
    message: "Your request to join group 'Fryly' has been approved.",
    read: false,
    groupId: 'g1',
    sectionId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 102,
    type: 'NOTE_UPDATED',
    title: 'Note updated',
    message: 'Alice updated a note.',
    read: true,
    groupId: 'g1',
    sectionId: 20,
    createdAt: new Date().toISOString(),
  },
]

function renderPage(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ActivityPage />
    </MemoryRouter>
  )
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Default: activity tab resolves immediately, notifications tab empty
  axiosClient.get.mockResolvedValue({ data: [] })
})

// ─── page structure ───────────────────────────────────────────────────────────

describe('ActivityPage – structure', () => {
  it('renders the page title', async () => {
    await act(async () => { renderPage() })
    expect(screen.getByText('Activity & Notifications')).toBeInTheDocument()
  })

  it('renders both tab buttons', async () => {
    await act(async () => { renderPage() })
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })
})

// ─── activity tab ─────────────────────────────────────────────────────────────

describe('ActivityPage – Activity tab', () => {
  it('shows activity tab content by default', async () => {
    axiosClient.get.mockResolvedValue({ data: SAMPLE_ACTIVITIES })

    await act(async () => { renderPage() })

    await waitFor(() =>
      expect(axiosClient.get).toHaveBeenCalledWith('/activity/recent')
    )
  })

  it('renders activity entries from the API', async () => {
    axiosClient.get.mockResolvedValue({ data: SAMPLE_ACTIVITIES })

    await act(async () => { renderPage() })

    await waitFor(() =>
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    )
  })

  it('shows empty state when no activities exist', async () => {
    axiosClient.get.mockResolvedValue({ data: [] })

    await act(async () => { renderPage() })

    await waitFor(() =>
      expect(
        screen.getByText(/no recent activity across your groups/i)
      ).toBeInTheDocument()
    )
  })
})

// ─── notifications tab ────────────────────────────────────────────────────────

describe('ActivityPage – Notifications tab', () => {
  it('switches to notifications tab on click', async () => {
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })                                        // activity tab
      .mockResolvedValue({ data: { content: [], last: true } })                   // notifications tab

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    expect(axiosClient.get).toHaveBeenCalledWith(
      '/notifications',
      expect.objectContaining({ params: expect.objectContaining({ page: 0 }) })
    )
  })

  it('renders notification entries', async () => {
    // First call is for activity tab, second for notifications
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })                              // activity tab
      .mockResolvedValue({ data: { content: SAMPLE_NOTIFICATIONS, last: true } })

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('Group join approved')).toBeInTheDocument()
    )
  })

  it('shows push notification toggle when push is supported', async () => {
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })                                        // activity tab
      .mockResolvedValue({ data: { content: [], last: true } })                   // notifications tab

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('Push notifications')).toBeInTheDocument()
    )
  })

  it('shows empty state when no notifications exist', async () => {
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: { content: [], last: true } })

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('No notifications yet.')).toBeInTheDocument()
    )
  })

  it('shows "Mark all read" when there are unread notifications', async () => {
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: { content: SAMPLE_NOTIFICATIONS, last: true } })

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    await waitFor(() =>
      expect(screen.getByText('Mark all read')).toBeInTheDocument()
    )
  })

  it('calls mark-all-read endpoint when button is clicked', async () => {
    axiosClient.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: { content: SAMPLE_NOTIFICATIONS, last: true } })
    axiosClient.post.mockResolvedValue({})

    await act(async () => { renderPage() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    })

    await waitFor(() => screen.getByText('Mark all read'))

    await act(async () => {
      fireEvent.click(screen.getByText('Mark all read'))
    })

    expect(axiosClient.post).toHaveBeenCalledWith('/notifications/mark-all-read')
  })
})
