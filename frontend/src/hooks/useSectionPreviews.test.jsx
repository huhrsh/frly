import { beforeEach, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSectionPreviews } from './useSectionPreviews';
import axiosClient from '../api/axiosClient';

const user = { id: 10 };
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('../api/axiosClient', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it('uses the earliest unsent due reminder, regardless of creation order', async () => {
    axiosClient.get.mockResolvedValue({ data: [
        { id: 1, title: 'Soon', isSent: false, triggerTime: '2026-10-09T09:00:00Z' },
        { id: 9, title: 'Later', isSent: false, triggerTime: '2026-10-11T09:00:00Z' },
        { id: 10, title: 'Already sent', isSent: true, triggerTime: '2026-10-08T09:00:00Z' },
    ] });
    const { result } = renderHook(() => useSectionPreviews([{ id: 20, type: 'REMINDER' }]));
    await waitFor(() => expect(result.current[20]?.next?.title).toBe('Soon'));
    expect(result.current[20].activeCount).toBe(2);
});

it('marks failed previews as errors instead of empty content', async () => {
    axiosClient.get.mockRejectedValue(new Error('Unavailable'));
    const { result } = renderHook(() => useSectionPreviews([{ id: 20, type: 'PAYMENT' }]));
    await waitFor(() => expect(result.current[20]).toEqual({ kind: 'PAYMENT', error: true }));
});
