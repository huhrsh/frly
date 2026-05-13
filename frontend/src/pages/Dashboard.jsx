import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useDispatch } from 'react-redux';
import { selectGroup, clearGroup } from '../redux/slices/groupSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Copy, Users, ChevronDown, ChevronUp, X, Check, Search, Pin, PinOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Onboarding checklist ────────────────────────────────────────────────────

const STEPS = [
    {
        key: 'hasGroup',
        label: 'Create or join a group',
        description: 'Your shared workspace for a flat, family, or crew.',
        actions: (navigate) => (
            <div className="flex flex-wrap gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => navigate('/groups/create')}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                    Create a group →
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/groups/join')}
                    className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
                >
                    Join one
                </button>
            </div>
        ),
    },
    {
        key: 'hasSection',
        label: 'Add your first section',
        description: 'Notes, checklists, files, reminders, expenses — pick what your group needs.',
        actions: (navigate, firstGroupId) => (
            <button
                type="button"
                onClick={() => firstGroupId && navigate(`/groups/${firstGroupId}`)}
                disabled={!firstGroupId}
                className="mt-2 px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-40"
            >
                Open workspace →
            </button>
        ),
    },
    {
        key: 'hasMember',
        label: 'Invite someone or have a member join',
        description: 'Collaboration is better with others. Share your invite code or link.',
        actions: (navigate, firstGroupId) => (
            <button
                type="button"
                onClick={() => firstGroupId && navigate(`/groups/${firstGroupId}?manage=1`)}
                disabled={!firstGroupId}
                className="mt-2 px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-40"
            >
                Invite someone →
            </button>
        ),
    },
];

const OnboardingChecklist = ({ onboarding, firstGroupId, userId, navigate }) => {
    const dismissedKey = `fryly_onboarding_dismissed_${userId}`;
    const collapsedKey = `fryly_onboarding_collapsed_${userId}`;

    const [dismissed, setDismissed] = useState(() =>
        localStorage.getItem(dismissedKey) === 'true'
    );
    const [collapsed, setCollapsed] = useState(() =>
        localStorage.getItem(collapsedKey) === 'true'
    );

    const allComplete = onboarding.hasGroup && onboarding.hasSection && onboarding.hasMember;
    const completedCount = [onboarding.hasGroup, onboarding.hasSection, onboarding.hasMember].filter(Boolean).length;

    // Auto-dismiss when all steps done
    useEffect(() => {
        if (allComplete && !dismissed) {
            localStorage.setItem(dismissedKey, 'true');
            setDismissed(true);
        }
    }, [allComplete, dismissed, dismissedKey]);

    if (dismissed) return null;

    const handleDismiss = () => {
        localStorage.setItem(dismissedKey, 'true');
        setDismissed(true);
    };

    const handleToggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem(collapsedKey, String(next));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
                <button
                    type="button"
                    onClick={handleToggleCollapse}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                    <span className="text-sm font-semibold text-blue-800">Getting started</span>
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                        {completedCount}/3
                    </span>
                    {collapsed
                        ? <ChevronDown size={15} className="text-blue-500 ml-auto" />
                        : <ChevronUp size={15} className="text-blue-500 ml-auto" />
                    }
                </button>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="ml-3 p-1 rounded text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition"
                    aria-label="Dismiss onboarding"
                    title="Dismiss"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Steps */}
            {!collapsed && (
                <ul className="divide-y divide-gray-100">
                    {STEPS.map((step) => {
                        const done = onboarding[step.key];
                        return (
                            <li key={step.key} className={`px-4 py-3 ${done ? 'opacity-60' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <span className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${done
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-gray-300 bg-white'}`}
                                    >
                                        {done && <Check size={11} className="text-white" strokeWidth={3} />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                            {step.label}
                                        </p>
                                        {!done && (
                                            <>
                                                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                                                {step.actions(navigate, firstGroupId)}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
    const [groups, setGroups] = useState([]);
    const [invites, setInvites] = useState([]);
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groupSearch, setGroupSearch] = useState('');
    const [activityStatus, setActivityStatus] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        dispatch(clearGroup());
        const fetchAll = async () => {
            try {
                const [groupsRes, invitesRes, onboardingRes] = await Promise.all([
                    axiosClient.get('/users/me/groups'),
                    axiosClient.get('/invites/mine').catch(() => ({ data: [] })),
                    axiosClient.get('/users/me/onboarding-status').catch(() => ({ data: null })),
                ]);
                setGroups(groupsRes.data || []);
                setInvites(invitesRes.data || []);
                setOnboarding(onboardingRes.data);
                // Fetch activity status separately — failure is non-critical
                axiosClient.get('/groups/activity-status').then(res => {
                    setActivityStatus(res.data || {});
                }).catch(() => {});
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [dispatch]);

    const handleTogglePin = async (group, e) => {
        e.stopPropagation();
        // Optimistic update
        setGroups(prev => prev.map(g => g.id === group.id ? { ...g, pinned: !g.pinned } : g));
        try {
            await axiosClient.patch(`/groups/${group.id}/pin`);
        } catch {
            // Revert on failure
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, pinned: group.pinned } : g));
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!groups || groups.length === 0) return;

        const storedGroupId = localStorage.getItem('currentGroupId');
        if (!storedGroupId) return;

        const visible = groups.filter(g => g.membershipStatus !== 'REMOVED');
        const match = visible.find(g => String(g.id) === String(storedGroupId) && g.membershipStatus === 'APPROVED');
        if (!match) return;

        dispatch(selectGroup(match));
        navigate(`/groups/${match.id}`);
    }, [loading, groups, dispatch, navigate]);

    const handleGroupClick = (group) => {
        if (group.membershipStatus && group.membershipStatus !== 'APPROVED') {
            toast.info('Your join request is pending approval for this group.');
            return;
        }
        dispatch(selectGroup(group));
        navigate(`/groups/${group.id}`);
    };

    const handleManageGroup = (group, event) => {
        event.stopPropagation();
        navigate(`/groups/${group.id}?manage=1`);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const visibleGroups = groups.filter(g => g.membershipStatus !== 'REMOVED');
    const filteredGroups = (groupSearch.trim()
        ? visibleGroups.filter(g => g.displayName?.toLowerCase().includes(groupSearch.toLowerCase()))
        : visibleGroups
    ).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    const totalGroups  = visibleGroups.length;
    const ownerGroups  = visibleGroups.filter(g => g.currentUserRole === 'OWNER').length;
    const adminGroups  = visibleGroups.filter(g => g.currentUserRole === 'ADMIN').length;
    const memberGroups = visibleGroups.filter(g => g.currentUserRole === 'MEMBER').length;
    const viewerGroups = visibleGroups.filter(g => g.currentUserRole === 'VIEWER').length;
    const pendingGroups = visibleGroups.filter(g => g.membershipStatus === 'PENDING').length;
    const pendingInvites = invites.length;

    const approvedGroups = visibleGroups.filter(g => g.membershipStatus === 'APPROVED');
    const DEMO_GROUP_ID = 10;
    const firstGroupId = (approvedGroups.find(g => g.id !== DEMO_GROUP_ID) ?? approvedGroups[0])?.id ?? null;

    // Show onboarding if: status loaded, not all steps done, and user hasn't dismissed
    const showOnboarding = onboarding !== null
        && !(onboarding.hasGroup && onboarding.hasSection && onboarding.hasMember);

    return (
        <div className="min-h-full">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Your Groups</h1>
                        <p className="text-xs text-gray-500 mt-1">Overview of groups you own or are a member of.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/groups/join')}
                            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-xs font-medium transition"
                        >
                            Join Group
                        </button>
                        <button
                            onClick={() => navigate('/groups/create')}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium transition"
                        >
                            Create Group
                        </button>
                    </div>
                </div>

                {/* Stats row is shown even when user has no groups yet */}
                <>
                    {/* Desktop / tablet cards */}
                    <div className="hidden sm:grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total groups</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalGroups}</p>
                                </div>
                                <Users className="text-blue-500" size={22} />
                            </div>
                            {/* Roles breakdown card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your roles</p>
                                {totalGroups === 0 ? (
                                    <p className="text-2xl font-semibold text-gray-300">—</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {[
                                            { label: 'Owner',  value: ownerGroups,  color: 'text-amber-600' },
                                            { label: 'Admin',  value: adminGroups,  color: 'text-purple-600' },
                                            { label: 'Member', value: memberGroups, color: 'text-gray-700' },
                                            { label: 'Viewer', value: viewerGroups, color: 'text-teal-600' },
                                        ].map(r => (
                                            <div key={r.label} className="flex items-baseline gap-1.5">
                                                <span className={`text-lg font-semibold leading-none ${r.color}`}>{r.value}</span>
                                                <span className="text-[10px] text-gray-400">{r.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending joins</p>
                                <p className="text-2xl font-semibold text-amber-600">{pendingGroups}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/groups/join')}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:border-blue-200 hover:shadow-md transition cursor-pointer"
                            >
                                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center justify-between">
                                    <span>Invites</span>
                                    {pendingInvites > 0 && (
                                        <span className="text-[10px] font-medium text-blue-600 underline-offset-2">View</span>
                                    )}
                                </p>
                                <p className="text-2xl font-semibold text-blue-600 mt-1">{pendingInvites}</p>
                            </button>
                        </div>

                        {/* Mobile compact summary */}
                        <div className="sm:hidden flex justify-center mt-2">
                            <div className="flex w-full items-center rounded-2xl bg-white border border-gray-100 shadow-sm px-3 py-2 gap-2 overflow-x-auto">
                                {[
                                    { label: 'Total',   value: totalGroups,   color: 'text-gray-900',  labelColor: 'text-gray-500',  onClick: null },
                                    ownerGroups  > 0 && { label: 'Owner',   value: ownerGroups,   color: 'text-amber-700', labelColor: 'text-amber-600',  onClick: null },
                                    adminGroups  > 0 && { label: 'Admin',   value: adminGroups,   color: 'text-purple-700', labelColor: 'text-purple-600', onClick: null },
                                    memberGroups > 0 && { label: 'Member',  value: memberGroups,  color: 'text-gray-700',  labelColor: 'text-gray-500',   onClick: null },
                                    viewerGroups > 0 && { label: 'Viewer',  value: viewerGroups,  color: 'text-teal-700',  labelColor: 'text-teal-600',   onClick: null },
                                    pendingGroups > 0 && { label: 'Pending', value: pendingGroups, color: 'text-amber-600', labelColor: 'text-amber-500',  onClick: null },
                                    { label: 'Invites', value: pendingInvites, color: 'text-blue-600', labelColor: 'text-blue-500', onClick: () => navigate('/groups/join') },
                                ].filter(Boolean).map((item, idx, arr) => (
                                    <React.Fragment key={item.label}>
                                        <div
                                            className={`flex-shrink-0 flex flex-col items-center px-1 ${item.onClick ? 'cursor-pointer' : ''}`}
                                            onClick={item.onClick || undefined}
                                        >
                                            <span className={`text-[10px] ${item.labelColor}`}>{item.label}</span>
                                            <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                                        </div>
                                        {idx < arr.length - 1 && <div className="h-7 w-px bg-gray-100 flex-shrink-0" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </>

                {/* Onboarding checklist — shown above the groups grid for users with incomplete steps */}
                {showOnboarding && user && (
                    <OnboardingChecklist
                        onboarding={onboarding}
                        firstGroupId={firstGroupId}
                        userId={user.id}
                        navigate={navigate}
                    />
                )}

                {visibleGroups.length > 0 && (
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={groupSearch}
                            onChange={e => setGroupSearch(e.target.value)}
                            placeholder="Filter groups…"
                            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-300"
                        />
                    </div>
                )}

                {visibleGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">You're not in any groups yet.</p>
                        <p className="text-xs mt-1">Create or join a group to get started.</p>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">No groups match "{groupSearch}".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredGroups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => handleGroupClick(group)}
                                className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border overflow-hidden ${group.pinned ? 'border-blue-200' : 'border-transparent hover:border-blue-200'}`}
                            >
                                {activityStatus[group.id] && (
                                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full z-10" title="New activity" />
                                )}
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-2 gap-2">
                                        <h3 className="text-base sm:text-lg capitalize font-bold text-gray-800 truncate">{group.displayName}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => handleTogglePin(group, e)}
                                                className={`p-1 rounded-md transition ${group.pinned ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 hover:text-gray-500'}`}
                                                title={group.pinned ? 'Unpin group' : 'Pin group'}
                                            >
                                                {group.pinned ? <Pin size={13} /> : <PinOff size={13} />}
                                            </button>
                                            {(() => {
                                                const role = group.currentUserRole || 'MEMBER';
                                                const roleStyle = {
                                                    OWNER:  'bg-amber-50 text-amber-700 border border-amber-200',
                                                    ADMIN:  'bg-purple-50 text-purple-700 border border-purple-100',
                                                    MEMBER: 'bg-gray-100 text-gray-500 border border-gray-200',
                                                    VIEWER: 'bg-teal-50 text-teal-700 border border-teal-100',
                                                }[role] || 'bg-gray-100 text-gray-500 border border-gray-200';
                                                return (
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roleStyle}`}>
                                                        {role.charAt(0) + role.slice(1).toLowerCase()}
                                                    </span>
                                                );
                                            })()}
                                            {(group.currentUserRole === 'ADMIN' || group.currentUserRole === 'OWNER') && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleManageGroup(group, e)}
                                                    className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                                >
                                                    Manage
                                                </button>
                                            )}
                                        </div>
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
                                        {(group.currentUserRole === 'ADMIN' || group.currentUserRole === 'OWNER') && group.pendingMemberCount > 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                                                {group.pendingMemberCount} pending
                                            </span>
                                        )}
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
