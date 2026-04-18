import React, { useEffect, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatTimeAgo } from '../utils/dateUtils';

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

const ActivityFeed = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);
    const scrollRef = useRef(null);

    const PAGE_SIZE = 15;

    const fetchPage = async (pageToLoad = 0) => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/activity/recent', {
                params: { page: pageToLoad, size: PAGE_SIZE },
            });
            const data = res.data || {};
            const items = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
            if (pageToLoad === 0) {
                setActivities(items);
            } else {
                setActivities(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    return [...prev, ...items.filter(a => !existingIds.has(a.id))];
                });
            }
            const isLast = typeof data.last === 'boolean' ? data.last : items.length < PAGE_SIZE;
            setHasMore(!isLast);
            setPage(pageToLoad);
        } catch {
            if (pageToLoad === 0) setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setActivities([]);
            setPage(0);
            setHasMore(true);
            fetchPage(0);
        }
    }, [open]);

    // Click-outside closes dropdown
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        if (!loading && hasMore && el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
            fetchPage(page + 1);
        }
    };

    const handleEntryClick = (entry) => {
        setOpen(false);
        if (entry.sectionId && entry.groupId) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            if (isMobile) {
                navigate(`/groups/${entry.groupId}/sections/${entry.sectionId}`);
            } else {
                navigate(`/groups/${entry.groupId}?section=${entry.sectionId}`);
            }
        } else if (entry.groupId) {
            navigate(`/groups/${entry.groupId}`);
        }
    };

    // Group entries by date label
    const grouped = activities.reduce((acc, entry) => {
        const d = new Date(entry.createdAt);
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

    const initials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition"
                aria-label="Activity feed"
                title="Activity"
            >
                <History size={16} />
            </button>

            {open && (
                <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-16 sm:top-auto sm:right-0 sm:mt-2 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-800">Recent activity</span>
                        <button
                            type="button"
                            onClick={() => fetchPage(0)}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Refresh
                        </button>
                    </div>

                    <div
                        ref={scrollRef}
                        className="max-h-[60vh] sm:max-h-96 overflow-y-auto"
                        onScroll={handleScroll}
                    >
                        {loading && activities.length === 0 && (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            </div>
                        )}

                        {!loading && activities.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No recent activity.</p>
                        )}

                        {Object.entries(grouped).map(([label, entries]) => (
                            <div key={label}>
                                <div className="px-4 pt-1 pb-1 text-[10px] font-semibold text-gray-800 bg-gray-100 uppercase tracking-wide">
                                    {label}
                                </div>
                                {entries.map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => handleEntryClick(entry)}
                                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                            {entry.actorPfpUrl
                                                ? <img src={entry.actorPfpUrl} alt={entry.actorName} className="w-full h-full object-cover" />
                                                : initials(entry.actorName)
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-800 leading-snug">
                                                <span className="font-medium">{entry.actorName || 'Someone'}</span>
                                                {' '}{formatAction(entry)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {entry.groupName && (
                                                    <span className="text-blue-500 font-medium">{entry.groupName} · </span>
                                                )}
                                                {formatTimeAgo(entry.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}

                        {loading && activities.length > 0 && (
                            <div className="flex justify-center py-3">
                                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            </div>
                        )}

                        {!loading && !hasMore && activities.length > 0 && (
                            <p className="text-center text-[10px] text-gray-300 py-2">No more activity</p>
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100">
                        <Link
                            to="/activity"
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

export default ActivityFeed;
