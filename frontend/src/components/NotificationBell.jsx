import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { formatTimeAgo } from '../utils/dateUtils';

const formatNotificationType = (type) => {
    if (!type) return '';
    const preset = {
        ITEM_ADDED: 'Item added',
        ITEM_UPDATED: 'Item updated',
        ITEM_DELETED: 'Item deleted',
        ITEM_COMPLETED: 'Item completed',
        PAYMENT_ADDED: 'Payment added',
        PAYMENT_UPDATED: 'Payment updated',
        PAYMENT_DELETED: 'Payment deleted',
        SECTION_CREATED: 'Section created',
        SECTION_DELETED: 'Section deleted',
        FILE_UPLOADED: 'File uploaded',
        FILE_DELETED: 'File deleted',
        NOTE_CREATED: 'Note created',
        NOTE_UPDATED: 'Note updated',
        REMINDER_CREATED: 'Reminder added',
        REMINDER_UPDATED: 'Reminder updated',
        REMINDER_DELETED: 'Reminder removed',
        REMINDER_DUE: 'Reminder due',
        REMINDER_OVERDUE: 'Reminder overdue',
        GROUP_INVITE_RECEIVED: 'Group invite',
        GROUP_JOIN_APPROVED: 'Join approved',
        GROUP_JOIN_REJECTED: 'Join request declined',
        MEMBER_JOINED: 'Member joined',
        MEMBER_LEFT: 'Member left',
        GROUP_LEFT: 'Left group',
        GROUP_MEMBER_LEFT: 'Member left',
        GROUP_MEMBER_REMOVED: 'Removed from group',
    };
    if (preset[type]) return preset[type];
    // Fallback: transform SNAKE_CASE into Title Case
    return type
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pollingRef = useRef(null);
    const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
    const [pushLoading, setPushLoading] = useState(false);

    const fetchUnreadCount = async () => {
        try {
            const response = await axiosClient.get('/notifications/unread-count');
            const data = response.data;
            const count = typeof data === 'number' ? data : (data && typeof data.count === 'number' ? data.count : 0);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load unread notification count', error);
        }
    };

    const fetchNotificationsPage = async (pageToLoad = 0) => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/notifications', {
                params: { page: pageToLoad, size: 10 },
            });
            const data = response.data || {};
            const items = data.content || data.items || [];
            if (pageToLoad === 0) {
                setNotifications(items);
            } else {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const toAdd = items.filter(n => !existingIds.has(n.id));
                    return [...prev, ...toAdd];
                });
            }
            const isLast = typeof data.last === 'boolean' ? data.last : items.length < 10;
            setHasMore(!isLast);
            setPage(pageToLoad);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    // Polling for unread count every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        
        // Start polling
        pollingRef.current = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds
        
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) {
            // Reset pagination and load notifications + latest count only when opening
            setNotifications([]);
            setHasMore(true);
            setPage(0);
            if (!loading) {
                fetchUnreadCount();
                fetchNotificationsPage(0);
            }
        }
    };

    const markAsRead = async (id) => {
        try {
            await axiosClient.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type / available ids
        let target = null;
        if (notification.groupId && notification.sectionId) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            target = isMobile
                ? `/groups/${notification.groupId}/sections/${notification.sectionId}`
                : `/groups/${notification.groupId}?section=${notification.sectionId}&view=WORKSPACE`;
        } else if (notification.type === 'GROUP_INVITE_RECEIVED') {
            target = '/groups/join';
        } else if (notification.type === 'GROUP_JOIN_REQUEST') {
            target = notification.groupId ? `/groups/${notification.groupId}?manage=1` : '/dashboard';
        } else if (['GROUP_JOIN_APPROVED', 'GROUP_JOIN_REJECTED', 'MEMBER_JOINED', 'GROUP_MEMBER_LEFT', 'GROUP_MEMBER_REMOVED'].includes(notification.type)) {
            target = notification.groupId ? `/groups/${notification.groupId}` : '/dashboard';
        }

        if (target) {
            navigate(target);
            setOpen(false);
        }
    };

    const handleScroll = (event) => {
        const target = event.currentTarget;
        if (!loading && hasMore && target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
            fetchNotificationsPage(page + 1);
        }
    };

    const handlePushToggle = async () => {
        setPushLoading(true);
        try {
            if (isSubscribed) {
                await unsubscribe();
                toast.success('Push notifications disabled');
            } else {
                const success = await subscribe();
                if (success) {
                    toast.success('Push notifications enabled');
                } else {
                    toast.error('Failed to enable push notifications');
                }
            }
        } catch (error) {
            toast.error('Error toggling push notifications');
        } finally {
            setPushLoading(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-16 sm:top-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-800">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await axiosClient.post('/notifications/mark-all-read');
                                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                            setUnreadCount(0);
                                        } catch (error) {
                                            console.error('Failed to mark all notifications as read', error);
                                        }
                                    }}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                            {loading && <span className="text-xs text-gray-400">Loading...</span>}
                        </div>
                    </div>

                    {/* Push notification settings */}
                    {isSupported && permission !== 'denied' && (
                        <div className="px-4 py-2 border-b bg-gray-50/80">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <BellRing size={14} className="text-gray-600" />
                                    <span className="text-xs text-gray-700">Push notifications</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePushToggle}
                                    disabled={pushLoading}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        isSubscribed ? 'bg-blue-600' : 'bg-gray-300'
                                    } ${pushLoading ? 'opacity-50' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isSubscribed ? 'translate-x-5' : 'translate-x-0.5'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto" onScroll={handleScroll}>
                        {loading && (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No notifications yet.</p>
                        )}

                        {!loading && (() => {
                            // Group by date label (same logic as ActivityFeed)
                            const grouped = notifications.reduce((acc, n) => {
                                const d = new Date(n.createdAt);
                                const today = new Date();
                                const yesterday = new Date(today);
                                yesterday.setDate(today.getDate() - 1);
                                let label;
                                if (d.toDateString() === today.toDateString()) label = 'Today';
                                else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
                                else label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                if (!acc[label]) acc[label] = [];
                                acc[label].push(n);
                                return acc;
                            }, {});

                            const initials = (name) => {
                                if (!name) return '?';
                                return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                            };

                            return Object.entries(grouped).map(([label, entries]) => (
                                <div key={label}>
                                    <div className="px-4 pt-1 pb-1 text-[10px] font-semibold text-gray-700 bg-gray-100 uppercase tracking-wide">
                                        {label}
                                    </div>
                                    {entries.map(n => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition border-b border-gray-100 last:border-b-0 ${n.read ? '' : 'bg-blue-50/60'}`}
                                        >
                                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                {initials(n.actorName)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {n.title && (
                                                    <p className="text-xs font-semibold text-gray-900 leading-snug truncate">{n.title}</p>
                                                )}
                                                <p className="text-xs text-gray-700 leading-snug line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {formatTimeAgo(n.createdAt)}
                                                </p>
                                            </div>
                                            {!n.read && (
                                                <span className="flex-shrink-0 mt-1 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ));
                        })()}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100">
                        <Link
                            to="/activity?tab=notifications"
                            onClick={() => setOpen(false)}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            View all →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
