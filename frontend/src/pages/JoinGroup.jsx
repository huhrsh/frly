import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JoinGroup = () => {
    const [inviteCode, setInviteCode] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/groups/join', { inviteCode });
            toast.success('Join request sent! An admin must approve you.');
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to join group", error);
            const message = error.response?.data?.message || 'Failed to join group. Check code or request status.';
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Join an existing group
                        </h1>
                        <p className="text-sm text-gray-700 max-w-md">
                            Use the invite code that an admin shared with you to request access to their group.
                        </p>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">How it works</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Enter the invite code exactly as you received it.</li>
                                <li>Your request will be sent to the group admins for approval.</li>
                                <li>You can see the status of your request on your dashboard.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8 w-full">
                    <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
                        Join Group
                    </h2>
                    <p className="mt-1 text-xs text-center text-slate-500">Paste the invite code shared with you by a group admin.</p>

                    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium leading-6 text-slate-900">
                                Invite Code
                            </label>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                required
                                className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3 tracking-widest uppercase"
                                placeholder="e.g. ABCD-1234"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                        >
                            Request to join
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default JoinGroup;