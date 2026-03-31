import { describe, it, expect, beforeEach } from 'vitest'
import reducer, {
  selectGroup,
  clearGroup,
  setGroupId,
  fetchGroupDetails,
} from './groupSlice'

const initialState = { currentGroup: null, loading: false, error: null }

beforeEach(() => {
  localStorage.clear()
})

// ─── selectGroup ─────────────────────────────────────────────────────────────

describe('selectGroup', () => {
  it('sets currentGroup to the dispatched payload', () => {
    const group = { id: 1, displayName: 'Flat Mates' }
    const state = reducer(initialState, selectGroup(group))
    expect(state.currentGroup).toEqual(group)
  })

  it('syncs group id to localStorage when group has an id', () => {
    const group = { id: 7, displayName: 'My Group' }
    reducer(initialState, selectGroup(group))
    expect(localStorage.getItem('currentGroupId')).toBe('7')
  })

  it('does not set localStorage when group has no id', () => {
    const group = { displayName: 'No ID Group' }
    reducer(initialState, selectGroup(group))
    expect(localStorage.getItem('currentGroupId')).toBeNull()
  })
})

// ─── clearGroup ──────────────────────────────────────────────────────────────

describe('clearGroup', () => {
  it('sets currentGroup back to null', () => {
    const stateWithGroup = { ...initialState, currentGroup: { id: 1 } }
    const state = reducer(stateWithGroup, clearGroup())
    expect(state.currentGroup).toBeNull()
  })

  it('does not change loading or error', () => {
    const stateWithGroup = { currentGroup: { id: 1 }, loading: false, error: 'some error' }
    const state = reducer(stateWithGroup, clearGroup())
    expect(state.loading).toBe(false)
    expect(state.error).toBe('some error')
  })
})

// ─── setGroupId ──────────────────────────────────────────────────────────────

describe('setGroupId', () => {
  it('syncs id to localStorage', () => {
    reducer(initialState, setGroupId(42))
    expect(localStorage.getItem('currentGroupId')).toBe('42')
  })

  it('does not sync null id', () => {
    reducer(initialState, setGroupId(null))
    expect(localStorage.getItem('currentGroupId')).toBeNull()
  })
})

// ─── fetchGroupDetails async thunk reducers ──────────────────────────────────

describe('fetchGroupDetails extraReducers', () => {
  it('pending sets loading=true and clears error', () => {
    const pendingAction = fetchGroupDetails.pending('req-id', 1)
    const state = reducer({ ...initialState, error: 'old error' }, pendingAction)
    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('fulfilled sets loading=false and updates currentGroup', () => {
    const group = { id: 3, displayName: 'Fetched Group' }
    const fulfilledAction = fetchGroupDetails.fulfilled(group, 'req-id', 3)
    const state = reducer({ ...initialState, loading: true }, fulfilledAction)
    expect(state.loading).toBe(false)
    expect(state.currentGroup).toEqual(group)
  })

  it('fulfilled syncs group id to localStorage', () => {
    const group = { id: 3, displayName: 'Fetched Group' }
    reducer({ ...initialState, loading: true }, fetchGroupDetails.fulfilled(group, 'req-id', 3))
    expect(localStorage.getItem('currentGroupId')).toBe('3')
  })

  it('rejected sets loading=false and stores error payload', () => {
    const rejectedAction = fetchGroupDetails.rejected(null, 'req-id', 1, 'Failed to fetch group')
    const state = reducer({ ...initialState, loading: true }, rejectedAction)
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Failed to fetch group')
  })
})
