import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { parseUTCDate } from '../utils/dateUtils';

const extractTextFromTiptap = (raw) => {
    if (!raw) return '';
    try {
        const doc = JSON.parse(raw);
        if (doc?.type !== 'doc') return raw;
        const lines = [];
        const walk = (node) => {
            if (!node) return;
            if (node.type === 'text') { lines.push(node.text || ''); return; }
            if (node.type === 'hardBreak') { lines.push(' '); return; }
            if (Array.isArray(node.content)) node.content.forEach(walk);
            if (['paragraph','heading','listItem','taskItem','blockquote','codeBlock'].includes(node.type)) {
                lines.push(' ');
            }
        };
        walk(doc);
        return lines.join('').trim().replace(/\s+/g, ' ');
    } catch {
        return raw;
    }
};

export const useSectionPreviews = (sections, refreshKey = 0) => {
    const [previews, setPreviews] = useState({});
    const { user } = useAuth();

    // Use a stable key based on section IDs so we don't refetch
    // just because a new array instance was created with the same items.
    const sectionIdsKey = !sections || sections.length === 0
        ? ''
        : sections.map(s => s.id).join(',');

    useEffect(() => {
        if (!sections || sections.length === 0) return;

        let isMounted = true;

        const loadPreviews = async () => {
            const newPreviews = {};

            await Promise.all(sections.map(async (section) => {
                if (section.type === 'FOLDER') return;

                try {
                    if (section.type === 'NOTE') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/note`);
                        const content = res.data?.content || '';
                        newPreviews[section.id] = {
                            kind: 'NOTE',
                            snippet: extractTextFromTiptap(content).slice(0, 220),
                            lastEditedAt: res.data?.lastEditedAt,
                            lastEditedByName: res.data?.lastEditedByName
                        };
                    } else if (section.type === 'LIST') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/items`);
                        const items = Array.isArray(res.data) ? res.data : [];
                        const openItems = items.filter(item => !item.completed).sort((a, b) => b.id - a.id);
                        const completedCount = items.length - openItems.length;
                        newPreviews[section.id] = {
                            kind: 'LIST',
                            openCount: openItems.length,
                            completedCount,
                            items: openItems.slice(0, 2).map(item => ({ text: item.text }))
                        };
                    } else if (section.type === 'LINKS') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/links`);
                        const links = Array.isArray(res.data) ? res.data : [];
                        newPreviews[section.id] = {
                            kind: 'LINKS',
                            count: links.length,
                        };
                    } else if (section.type === 'REMINDER') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/reminders`);
                        const items = Array.isArray(res.data) ? res.data : [];
                        const activeReminders = items.filter(r => !r.isSent)
                            .sort((a, b) => b.id - a.id);
                        newPreviews[section.id] = {
                            kind: 'REMINDER',
                            activeCount: activeReminders.length,
                            totalCount: items.length,
                            next: activeReminders[0]
                                ? { title: activeReminders[0].title, triggerTime: activeReminders[0].triggerTime }
                                : null
                        };
                    } else if (section.type === 'GALLERY') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/gallery/count`);
                        const totalCount = typeof res.data === 'number' ? res.data : 0;
                        newPreviews[section.id] = {
                            kind: 'GALLERY',
                            totalCount
                        };
                    } else if (section.type === 'PAYMENT') {
                        const [balancesRes, totalRes] = await Promise.all([
                            axiosClient.get(`/groups/sections/${section.id}/payments/balances`),
                            axiosClient.get(`/groups/sections/${section.id}/payments/expenses/total`),
                        ]);
                        const balances = Array.isArray(balancesRes.data) ? balancesRes.data : [];
                        const myBalance = balances.find(b => b.userId === user?.id);
                        const totalSpentRaw = totalRes?.data ?? 0;
                        const totalSpent = typeof totalSpentRaw === 'number'
                            ? totalSpentRaw
                            : parseFloat(totalSpentRaw || '0');
                        newPreviews[section.id] = {
                            kind: 'PAYMENT',
                            balance: myBalance ? myBalance.balance : 0,
                            totalSpent,
                            hasActivity: balances.length > 0 || totalSpent > 0,
                        };
                    } else if (section.type === 'CALENDAR') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/calendar-events`);
                        const events = Array.isArray(res.data) ? res.data : [];

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        const isSameDay = (a, b) => {
                            const da = parseUTCDate(a);
                            const db = parseUTCDate(b);
                            return da.getFullYear() === db.getFullYear()
                                && da.getMonth() === db.getMonth()
                                && da.getDate() === db.getDate();
                        };

                        const todayEvents = events.filter(ev => ev.startTime && isSameDay(ev.startTime, today))
                            .sort((a, b) => parseUTCDate(a.startTime) - parseUTCDate(b.startTime))
                            .slice(0, 3)
                            .map(ev => ({
                                title: ev.title,
                                startTime: ev.startTime,
                            }));

                        const pastCount = events.filter(ev => ev.startTime && parseUTCDate(ev.startTime) < today).length;
                        const upcomingCount = events.filter(ev => ev.startTime && parseUTCDate(ev.startTime) >= tomorrow).length;
                        const todayCount = todayEvents.length;

                        newPreviews[section.id] = {
                            kind: 'CALENDAR',
                            todayEvents,
                            totalCount: events.length,
                            pastCount,
                            todayCount,
                            upcomingCount,
                        };
                    }
                } catch (error) {
                    // Set empty preview so BentoGrid doesn't show "Loading..."
                    newPreviews[section.id] = { kind: section.type };
                }
            }));

            if (isMounted) {
                setPreviews(newPreviews);
            }
        };

        loadPreviews();

        return () => { isMounted = false; };
    }, [sectionIdsKey, user, refreshKey]); // Re-fetch if section IDs, user, or refreshKey changes

    return previews;
};
