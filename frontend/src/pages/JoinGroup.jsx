import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JoinGroup = () => {
    const [inviteCode, setInviteCode] = useState('');
    const [invites, setInvites] = useState([]);
    const [loadingInvites, setLoadingInvites] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadInvites = async () => {
            try {
                const res = await axiosClient.get('/invites/mine');
                setInvites(res.data || []);
            } catch (error) {
                console.error('Failed to load invites', error);
            } finally {
                setLoadingInvites(false);
            }
        };

        loadInvites();
    }, []);

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

    const handleAcceptInvite = async (inviteId) => {
        try {
            await axiosClient.post(`/invites/${inviteId}/accept`);
            toast.success('Invite accepted. You can access the group from your dashboard.');
            setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to accept invite', error);
            const message = error.response?.data?.message || 'Failed to accept invite.';
            toast.error(message);
        }
    };

    const handleDeclineInvite = async (inviteId) => {
        try {
            await axiosClient.post(`/invites/${inviteId}/decline`);
            toast.info('Invite declined.');
            setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        } catch (error) {
            console.error('Failed to decline invite', error);
            const message = error.response?.data?.message || 'Failed to decline invite.';
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen-dvh bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">
                        {/* Left: information */}
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                                Join an existing group
                            </h1>
                            <p className="text-sm text-gray-700 max-w-md">
                                Use the invite code that an admin shared with you to request access to their group, or accept a direct invite sent to your email.
                            </p>
                            <div className="space-y-2 text-sm text-gray-700 hidden sm:block">
                                <p className="font-semibold text-gray-900">How it works</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use an invite code from a group admin, or</li>
                                    <li>Accept a pending invite that was emailed to you.</li>
                                    <li>Admins may still need to approve certain joins.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right: actions (join by code + invites) */}
                        <div className="space-y-5">
                            <div className="bg-slate-50/60 rounded-2xl border border-gray-100 px-4 py-6 sm:px-6">
                                <h2 className="text-lg sm:text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
                                    Join Group by code
                                </h2>
                                <p className="mt-1 text-xs text-center text-slate-500">
                                    Paste the invite code shared with you by a group admin.
                                </p>

                                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 sm:px-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-base font-semibold leading-6 text-slate-900">Pending invites</h2>
                                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100">
                                        {loadingInvites ? '...' : `${invites.length} invite${invites.length === 1 ? '' : 's'}`}
                                    </span>
                                </div>
                                {loadingInvites ? (
                                    <p className="mt-3 text-xs text-slate-500">Loading your invites...</p>
                                ) : invites.length === 0 ? (
                                    <p className="mt-3 text-xs text-slate-500">You don&apos;t have any pending invites right now.</p>
                                ) : (
                                    <ul className="mt-3 space-y-3">
                                        {invites.map((invite) => (
                                            <li key={invite.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{invite.groupDisplayName}</p>
                                                    <p className="text-xs text-slate-500">Direct invite to this group</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeclineInvite(invite.id)}
                                                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAcceptInvite(invite.id)}
                                                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                                                    >
                                                        Accept
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JoinGroup;