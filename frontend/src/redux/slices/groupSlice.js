import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// Thunk for fetching group details
export const fetchGroupDetails = createAsyncThunk(
    'group/fetchGroupDetails',
    async (groupId, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/groups/${groupId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch group');
        }
    }
);

const initialState = {
    currentGroup: null,
    loading: false,
    error: null,
};

const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        selectGroup: (state, action) => {
            state.currentGroup = action.payload;
            // Sync with localStorage immediately so axios interceptor picks it up
            if (action.payload?.id) {
                localStorage.setItem('currentGroupId', action.payload.id);
            }
        },
        clearGroup: (state) => {
            state.currentGroup = null;
            localStorage.removeItem('currentGroupId');
        },
        // Useful if we need to set the group ID before we have the full object
        // to handle the race condition where we know the ID but haven't fetched details yet
        setGroupId: (state, action) => {
            if (action.payload) {
                localStorage.setItem('currentGroupId', action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGroupDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGroupDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentGroup = action.payload;
                // Ensure localStorage is synced when fetch succeeds
                if (action.payload?.id) {
                    localStorage.setItem('currentGroupId', action.payload.id);
                }
            })
            .addCase(fetchGroupDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { selectGroup, clearGroup, setGroupId } = groupSlice.actions;
export default groupSlice.reducer;
