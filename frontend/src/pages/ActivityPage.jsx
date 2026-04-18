import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, BellRing, History } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { formatTimeAgo } from '../utils/dateUtils';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'react-toastify';

const ACTION_LABELS = {
    SECTION_CREATED: 'created section',
    SECTION_DELETED: 'deleted section',
    SECTION_RENAMED: 'renamed section to',
    ITEM_ADDED: 'added item',
    ITEM_COMPLETED: 'completed',
    ITEM_DELETED: 'deleted item',
    NOTE_UPDATED: 'updated note in',
    REMINDER_CREATED: 'added reminder',
    EXPENSE_ADDED: 'added expense',
    EVENT_CREATED: 'created event',
    EVENT_DELETED: 'deleted event',
    FILE_UPLOADED: 'uploaded file',
    MEMBER_JOINED: 'joined the group',
    MEMBER_REMOVED: 'was removed from group',
    GROUP_RENAMED: 'renamed the group to',
};

const formatAction = (entry) => {
    const verb = ACTION_LABELS[entry.actionType] || entry.actionType?.toLowerCase().replace(/_/g, ' ');
    if (!entry.entityName) return verb;
    return `${verb} "${entry.entityName}"`;
};

const formatNotificationType = (type) => {
    if (!type) return '';
    const preset = {
        ITEM_ADDED: 'Item added', ITEM_UPDATED: 'Item updated', ITEM_DELETED: 'Item deleted',
        ITEM_COMPLETED: 'Item completed', PAYMENT_ADDED: 'Payment added', PAYMENT_UPDATED: 'Payment updated',
        PAYMENT_DELETED: 'Payment deleted', SECTION_CREATED: 'Section created', SECTION_DELETED: 'Section deleted',
        FILE_UPLOADED: 'File uploaded', FILE_DELETED: 'File deleted', NOTE_CREATED: 'Note created',
        NOTE_UPDATED: 'Note updated', REMINDER_CREATED: 'Reminder added', REMINDER_UPDATED: 'Reminder updated',
        REMINDER_DELETED: 'Reminder removed', REMINDER_DUE: 'Reminder due', REMINDER_OVERDUE: 'Reminder overdue',
        GROUP_INVITE_RECEIVED: 'Group invite', GROUP_JOIN_APPROVED: 'Join approved',
        GROUP_JOIN_REJECTED: 'Join request declined', MEMBER_JOINED: 'Member joined',
        MEMBER_LEFT: 'Member left', GROUP_LEFT: 'Left group', GROUP_MEMBER_LEFT: 'Member left',
        GROUP_MEMBER_REMOVED: 'Removed from group',
    };
    if (preset[type]) return preset[type];
    return type.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const groupByDate = (items, dateField = 'createdAt') => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc, entry) => {
        const d = new Date(entry[dateField]);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        let label;
        if (d.toDateString() === today.toDateString()) label = 'Today';
        else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
        else label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!acc[label]) acc[label] = [];
        acc[label].push(entry);
        return acc;
    }, {});
};

const initials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

const ActivityTab = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await axiosClient.get('/activity/recent');
                setActivities(Array.isArray(res.data) ? res.data : (res.data?.content || []));
            } catch {
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleClick = (entry) => {
        if (entry.sectionId && entry.groupId) {
            navigate(`/groups/${entry.groupId}?section=${entry.sectionId}`);
        } else if (entry.groupId) {
            navigate(`/groups/${entry.groupId}`);
        }
    };

    const grouped = groupByDate(activities);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-16 text-sm text-gray-400">
                No recent activity across your groups.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([label, entries]) => (
                <div key={label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">{label}</p>
                    <div className="space-y-1">
                        {entries.map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => handleClick(entry)}
                                className="w-full flex items-start gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm text-left transition"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                    {entry.actorPfpUrl
                                        ? <img src={entry.actorPfpUrl} alt={entry.actorName} className="w-full h-full object-cover" />
                                        : initials(entry.actorName)
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 leading-snug">
                                        <span className="font-medium">{entry.actorName || 'Someone'}</span>
                                        {' '}{formatAction(entry)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(entry.createdAt)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const NotificationsTab = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
    const [pushLoading, setPushLoading] = useState(false);

    const fetchPage = async (pageToLoad = 0) => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/notifications', { params: { page: pageToLoad, size: 20 } });
            const data = res.data || {};
            const items = data.content || data.items || [];
            if (pageToLoad === 0) {
                setNotifications(items);
            } else {
                setNotifications(prev => {
                    const ids = new Set(prev.map(n => n.id));
                    return [...prev, ...items.filter(n => !ids.has(n.id))];
                });
            }
            const isLast = typeof data.last === 'boolean' ? data.last : items.length < 20;
            setHasMore(!isLast);
            setPage(pageToLoad);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPage(0); }, []);

    const markAsRead = async (id) => {
        try {
            await axiosClient.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await axiosClient.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* silent */ }
    };

    const handleClick = async (n) => {
        if (!n.read) await markAsRead(n.id);
        let target = null;
        if (n.groupId && n.sectionId) target = `/groups/${n.groupId}/sections/${n.sectionId}`;
        else if (n.type === 'GROUP_INVITE_RECEIVED') target = '/groups/join';
        else if (['GROUP_JOIN_APPROVED', 'GROUP_JOIN_REJECTED', 'MEMBER_JOINED', 'GROUP_MEMBER_LEFT', 'GROUP_MEMBER_REMOVED'].includes(n.type))
            target = n.groupId ? `/groups/${n.groupId}` : '/dashboard';
        if (target) navigate(target);
    };

    const handlePushToggle = async () => {
        setPushLoading(true);
        try {
            if (isSubscribed) {
                await unsubscribe();
                toast.success('Push notifications disabled');
            } else {
                const success = await subscribe();
                if (success) toast.success('Push notifications enabled');
                else toast.error('Failed to enable push notifications');
            }
        } catch {
            toast.error('Error toggling push notifications');
        } finally {
            setPushLoading(false);
        }
    };

    const grouped = groupByDate(notifications);
    const unread = notifications.filter(n => !n.read).length;

    return (
        <div>
            {isSupported && permission !== 'denied' && (
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 mb-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <BellRing size={14} className="text-gray-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700 flex-shrink-0">Push notifications</span>
                        <span className="text-[11px] text-gray-400 truncate">
                            {isSubscribed ? '— Get alerts for expenses, reminders & groups' : '— Enable to get important updates'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handlePushToggle}
                        disabled={pushLoading}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isSubscribed ? 'bg-blue-600' : 'bg-gray-300'} ${pushLoading ? 'opacity-50' : ''}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSubscribed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            )}

            {unread > 0 && (
                <div className="flex justify-end mb-3">
                    <button type="button" onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                        Mark all read
                    </button>
                </div>
            )}

            {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400">No notifications yet.</div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([label, entries]) => (
                        <div key={label}>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">{label}</p>
                            <div className="space-y-1">
                                {entries.map(n => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => handleClick(n)}
                                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition ${n.read ? 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm' : 'bg-blue-50 border-blue-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                                            {n.actorPfpUrl
                                                ? <img src={n.actorPfpUrl} alt={n.actorName} className="w-full h-full object-cover" />
                                                : initials(n.actorName)
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {n.title && <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>}
                                            <p className="text-xs text-gray-700 leading-snug line-clamp-2">{n.message}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                                <span>{formatNotificationType(n.type)}</span>
                                                {n.createdAt && <><span>·</span><span>{formatTimeAgo(n.createdAt)}</span></>}
                                            </div>
                                        </div>
                                        {!n.read && <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => fetchPage(page + 1)}
                                disabled={loading}
                                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                            >
                                {loading ? 'Loading…' : 'Load more'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ActivityPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'activity';

    const setTab = (tab) => {
        setSearchParams(tab === 'notifications' ? { tab: 'notifications' } : {});
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-xl font-bold text-gray-900">Activity & Notifications</h1>
            </div>

            <div className="flex gap-1 mb-6 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setTab('activity')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                        activeTab === 'activity'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <History size={14} />
                    Activity
                </button>
                <button
                    type="button"
                    onClick={() => setTab('notifications')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                        activeTab === 'notifications'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Bell size={14} />
                    Notifications
                </button>
            </div>

            {activeTab === 'activity' ? <ActivityTab /> : <NotificationsTab />}
        </div>
    );
};

export default ActivityPage;
