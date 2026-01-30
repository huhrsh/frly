import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useDispatch } from 'react-redux';
import { selectGroup, clearGroup } from '../redux/slices/groupSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Copy, Users } from 'lucide-react';

const Dashboard = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(clearGroup());
        const fetchGroups = async () => {
            try {
                const response = await axiosClient.get('/users/me/groups');
                setGroups(response.data);
            } catch (error) {
                console.error("Failed to fetch groups", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, [dispatch]);

    const handleGroupClick = (group) => {
        if (group.membershipStatus && group.membershipStatus !== 'APPROVED') {
            toast.info('Your join request is pending approval for this group.');
            return;
        }
        dispatch(selectGroup(group));
        navigate(`/groups/${group.id}`);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const totalGroups = groups.length;
    const adminGroups = groups.filter(g => g.currentUserRole === 'ADMIN').length;
    const pendingGroups = groups.filter(g => g.membershipStatus === 'PENDING').length;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
                        <p className="text-sm text-gray-500 mt-1">Overview of groups you own or are a member of.</p>
                    </div>
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/groups/join')}
                            className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm"
                        >
                            Join Group
                        </button>
                        <button
                            onClick={() => navigate('/groups/create')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                        >
                            Create Group
                        </button>
                    </div>
                </div>

                {totalGroups > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total groups</p>
                                <p className="text-2xl font-semibold text-gray-900">{totalGroups}</p>
                            </div>
                            <Users className="text-blue-500" size={22} />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Admin of</p>
                            <p className="text-2xl font-semibold text-gray-900">{adminGroups}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending joins</p>
                            <p className="text-2xl font-semibold text-amber-600">{pendingGroups}</p>
                        </div>
                    </div>
                )}

                {groups.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg mb-4">You are not in any groups yet.</p>
                        <button
                            onClick={() => navigate('/groups/create')}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create one now →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => handleGroupClick(group)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-transparent hover:border-blue-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg capitalize font-bold text-gray-800">{group.displayName}</h3>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                                            {group.currentUserRole || 'MEMBER'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mb-4 gap-2 flex-wrap">
                                        {group.membershipStatus === 'PENDING' ? (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800">
                                                Pending Approval
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {group.status}
                                            </span>
                                        )}
                                        {typeof group.storageLimit === 'number' && group.storageLimit > 0 && (
                                            <>
                                                <span className="mx-1 text-gray-300">•</span>
                                                {(() => {
                                                    const usedMb = group.storageUsage / 1024 / 1024;
                                                    const limitMb = group.storageLimit / 1024 / 1024;
                                                    const percent = Math.min(100, (group.storageUsage / group.storageLimit) * 100);
                                                    return (
                                                        <span className="text-xs text-gray-600">
                                                            {percent.toFixed(0)}% used ({usedMb.toFixed(1)} MB of {limitMb.toFixed(1)} MB)
                                                        </span>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">Code</span>
                                            <span className="text-gray-700 uppercase font-mono text-[11px] bg-gray-50 px-1.5 py-0.5 rounded">
                                                {group.inviteCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(group.inviteCode || '').then(() => {
                                                        toast.success('Invite code copied');
                                                    }).catch(() => {
                                                        toast.error('Failed to copy');
                                                    });
                                                }}
                                                className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                                aria-label="Copy invite code"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                        {group.currentUserRole === 'ADMIN' && group.pendingMemberCount > 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                                                {group.pendingMemberCount} pending
                                            </span>
                                        )}
                                        {/* <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-block">Open →</span> */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
