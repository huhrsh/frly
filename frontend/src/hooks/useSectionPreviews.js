import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export const useSectionPreviews = (sections) => {
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
                            snippet: content.trim().slice(0, 220),
                            lastEditedAt: res.data?.lastEditedAt,
                            lastEditedByName: res.data?.lastEditedByName
                        };
                    } else if (section.type === 'LIST') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/items`);
                        const items = Array.isArray(res.data) ? res.data : [];
                        newPreviews[section.id] = {
                            kind: 'LIST',
                            items: items.slice(0, 3).map(item => ({ text: item.text, completed: item.completed }))
                        };
                    } else if (section.type === 'REMINDER') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/reminders`);
                        let items = Array.isArray(res.data) ? res.data : [];
                        // Sort: Unsent first
                        items.sort((a, b) => (a.isSent === b.isSent) ? 0 : a.isSent ? 1 : -1);

                        newPreviews[section.id] = {
                            kind: 'REMINDER',
                            reminders: items.slice(0, 3).map(r => ({
                                title: r.title,
                                triggerTime: r.triggerTime,
                                isSent: r.isSent
                            }))
                        };
                    } else if (section.type === 'GALLERY') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/gallery/count`);
                        const totalCount = typeof res.data === 'number' ? res.data : 0;
                        newPreviews[section.id] = {
                            kind: 'GALLERY',
                            totalCount
                        };
                    } else if (section.type === 'PAYMENT') {
                        const [balancesRes, expensesRes] = await Promise.all([
                            axiosClient.get(`/groups/sections/${section.id}/payments/balances`),
                            axiosClient.get(`/groups/sections/${section.id}/payments/expenses`),
                        ]);
                        const balances = Array.isArray(balancesRes.data) ? balancesRes.data : [];
                        const expenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];
                        // Find current user's balance, but also compute total volume so card isn't misleadingly 0
                        const myBalance = balances.find(b => b.userId === user?.userId);
                        const totalSpent = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
                        newPreviews[section.id] = {
                            kind: 'PAYMENT',
                            balance: myBalance ? myBalance.balance : 0,
                            totalSpent,
                            hasActivity: balances.length > 0 || expenses.length > 0,
                        };
                    } else if (section.type === 'CALENDAR') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/calendar-events`);
                        const events = Array.isArray(res.data) ? res.data : [];

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        const isSameDay = (a, b) => {
                            const da = new Date(a);
                            const db = new Date(b);
                            return da.getFullYear() === db.getFullYear()
                                && da.getMonth() === db.getMonth()
                                && da.getDate() === db.getDate();
                        };

                        const todayEvents = events.filter(ev => ev.startTime && isSameDay(ev.startTime, today))
                            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                            .slice(0, 3)
                            .map(ev => ({
                                title: ev.title,
                                startTime: ev.startTime,
                            }));

                        const pastCount = events.filter(ev => ev.startTime && new Date(ev.startTime) < today).length;
                        const upcomingCount = events.filter(ev => ev.startTime && new Date(ev.startTime) >= tomorrow).length;
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
                    // console.debug('Preview load failed', section.id);
                }
            }));

            if (isMounted) {
                setPreviews(newPreviews);
            }
        };

        loadPreviews();

        return () => { isMounted = false; };
    }, [sectionIdsKey, user]); // Re-fetch if section IDs change or user changes

    return previews;
};
