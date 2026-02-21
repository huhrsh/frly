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
                        const res = await axiosClient.get(`/groups/sections/${section.id}/gallery`);
                        const items = Array.isArray(res.data) ? res.data : [];
                        newPreviews[section.id] = {
                            kind: 'GALLERY',
                            images: items.slice(0, 4).map(img => ({
                                url: img.url,
                                type: img.contentType
                            })),
                            totalCount: items.length
                        };
                    } else if (section.type === 'PAYMENT') {
                        const res = await axiosClient.get(`/groups/sections/${section.id}/payments/balances`);
                        const balances = Array.isArray(res.data) ? res.data : [];
                        // Find current user's balance
                        const myBalance = balances.find(b => b.userId === user?.userId);
                        newPreviews[section.id] = {
                            kind: 'PAYMENT',
                            balance: myBalance ? myBalance.balance : 0,
                            hasActivity: balances.length > 0
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
