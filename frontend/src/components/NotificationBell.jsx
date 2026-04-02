import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
            target = `/groups/${notification.groupId}/sections/${notification.sectionId}`;
        } else if (notification.type === 'GROUP_INVITE_RECEIVED') {
            target = '/groups/join';
        } else if (notification.type === 'GROUP_JOIN_REQUEST') {
            target = notification.groupId ? `/groups/${notification.groupId}/manage` : '/dashboard';
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
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-100 z-50">
                    <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700">Notifications</span>
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
                                    className="text-[10px] text-blue-600 hover:text-blue-800"
                                >
                                    Mark all read
                                </button>
                            )}
                            {loading && <span className="text-[10px] text-gray-400">Loading...</span>}
                        </div>
                    </div>
                    
                    {/* Push notification settings */}
                    {isSupported && permission !== 'denied' && (
                        <div className="px-3 py-2 border-b bg-gray-50">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <BellRing size={14} className="text-gray-600" />
                                    <span className="text-[11px] text-gray-700">Push notifications</span>
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
                            <p className="text-[10px] text-gray-500 mt-1">
                                {isSubscribed 
                                    ? 'Get alerts for expenses, reminders & groups' 
                                    : 'Enable to get important updates'
                                }
                            </p>
                        </div>
                    )}
                    
                    <div className="max-h-80 overflow-y-auto" onScroll={handleScroll}>
                        {notifications.length === 0 && !loading ? (
                            <div className="px-3 py-4 text-xs text-gray-400 text-center">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`px-3 py-2 text-xs border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            {n.title && (
                                                <p className="font-semibold text-[11px] text-gray-900 mb-0.5 truncate">{n.title}</p>
                                            )}
                                            <p className="text-[11px] text-gray-700 leading-snug line-clamp-2">{n.message}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                                {n.actorName ? <span>{n.actorName}</span> : <span>System</span>}
                                                {n.createdAt && <span>·</span>}
                                                {n.createdAt && <span>{formatTimeAgo(n.createdAt)}</span>}
                                            </div>
                                        </div>
                                        {!n.read && (
                                            <div className="flex-shrink-0">
                                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
