import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../ConfirmModal';
import { ChevronRight } from 'lucide-react';

const ReminderView = ({ sectionId }) => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderDescription, setNewReminderDescription] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('');
    const [notify, setNotify] = useState(false);
    const [frequency, setFrequency] = useState('ONCE');
    const [editingId, setEditingId] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [showSent, setShowSent] = useState(false);

    useEffect(() => {
        fetchReminders();
    }, [sectionId]);

    // Keep the notify default in sync with the user's profile preference
    useEffect(() => {
        if (user && typeof user.reminderEmailEnabled === 'boolean') {
            setNotify(user.reminderEmailEnabled);
        }
    }, [user]);

    const fetchReminders = async () => {
        try {
            const res = await axiosClient.get(`/groups/sections/${sectionId}/reminders`);
            setReminders(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch reminders", error);
            
        }
    };

    const handleAddReminder = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newReminderTitle,
                description: newReminderDescription,
                triggerTime: newReminderTime,
                notify,
                frequency
            };

            if (editingId) {
                await axiosClient.put(`/groups/sections/reminders/${editingId}`, payload);
                await fetchReminders();
                setEditingId(null);
                toast.success("Reminder updated!");
            } else {
                const res = await axiosClient.post(`/groups/sections/${sectionId}/reminders`, payload);
                const createdId = res.data;
                const newReminder = {
                    id: createdId,
                    title: newReminderTitle,
                    description: newReminderDescription,
                    triggerTime: newReminderTime,
                    notify,
                    frequency,
                    isSent: false
                };
                setReminders(prev => [newReminder, ...prev]);
                toast.success("Reminder set!");
            }

            setNewReminderTitle('');
            setNewReminderDescription('');
            setNewReminderTime('');
            setNotify(user && typeof user.reminderEmailEnabled === 'boolean' ? user.reminderEmailEnabled : false);
            setFrequency('ONCE');
        } catch (error) {
            console.error("Failed to add reminder", error);
            toast.error("Failed to save reminder");
        }
    };

    const handleDelete = (reminder) => {
        setConfirmConfig({
            title: 'Delete reminder?',
            message: `Delete reminder "${reminder.title}"?`,
            confirmLabel: 'Delete',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/sections/reminders/${reminder.id}`);
                    setReminders(prev => prev.filter(r => r.id !== reminder.id));
                    toast.success('Reminder deleted');
                } catch (error) {
                    console.error('Failed to delete reminder', error);
                    toast.error('Failed to delete reminder');
                }
            }
        });
    };

    const startEdit = (reminder) => {
        setEditingId(reminder.id);
        setNewReminderTitle(reminder.title || '');
        setNewReminderDescription(reminder.description || '');
        if (reminder.triggerTime) {
            const dt = new Date(reminder.triggerTime);
            const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            setNewReminderTime(local);
        } else {
            setNewReminderTime('');
        }
        setNotify(!!reminder.notify);
        setFrequency(reminder.frequency || 'ONCE');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewReminderTitle('');
        setNewReminderDescription('');
        setNewReminderTime('');
        setNotify(user && typeof user.reminderEmailEnabled === 'boolean' ? user.reminderEmailEnabled : false);
        setFrequency('ONCE');
    };

    const activeReminders = reminders.filter(r => !r.isSent);
    const sentReminders = reminders.filter(r => r.isSent);

    return (
        <div className="h-full flex flex-col sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Reminders</h2>
            <p className="text-xs text-gray-500 mb-2">Set one-off or repeating reminders for your group.</p>

            {/* <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                To keep costs low while we&apos;re early, fryly processes reminders roughly once every hour. Emails and bell notifications may arrive with a delay.
            </div> */}

            <form onSubmit={handleAddReminder} className="mb-4">
                <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4 space-y-3">
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Reminder title"
                            value={newReminderTitle}
                            onChange={(e) => setNewReminderTitle(e.target.value)}
                            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            required
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={newReminderDescription}
                            onChange={(e) => setNewReminderDescription(e.target.value)}
                            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-y min-h-[70px]"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-600">Due date &amp; time</label>
                            <input
                                type="datetime-local"
                                value={newReminderTime}
                                onChange={(e) => setNewReminderTime(e.target.value)}
                                className="w-full h-10 border border-gray-200 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                required
                            />
                            <p className="text-[11px] text-gray-400">Set this to when you want to be nudged.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-600">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full h-10 border border-gray-200 px-3 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            >
                                <option value="ONCE">Once</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100">
                        <div>
                            <p className="text-[11px] font-medium text-gray-600">Email notification</p>
                            <p className="text-[11px] text-gray-400">We can email you when this reminder is due.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setNotify(!notify)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus:outline-none ${notify ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${notify ? 'translate-x-4' : 'translate-x-1'}`}
                                />
                            </button>
                            <span className="text-xs text-gray-700">Email me for this reminder</span>
                        </div>
                        <div className="flex justify-end gap-2 sm:ml-4">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700"
                            >
                                {editingId ? 'Update reminder' : 'Set reminder'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 mt-1">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active</h3>
                            {activeReminders.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{activeReminders.length}</span>
                            )}
                        </span>
                    </div>
                    {activeReminders.length === 0 && (
                        <p className="text-gray-400 text-xs">No active reminders.</p>
                    )}
                    <div className="space-y-2">
                        {activeReminders.map(reminder => (
                            <div
                                key={reminder.id}
                                className="bg-white border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate">{reminder.title}</h3>
                                            <p className="text-[11px] text-gray-600 mt-0.5">
                                                {reminder.triggerTime && new Date(reminder.triggerTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {reminder.description && (
                                        <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{reminder.description}</p>
                                    )}
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
                                        {reminder.notify && (
                                            <span className="px-2 py-0.5 rounded-full bg-white/70 text-blue-700 border border-blue-100">Email on</span>
                                        )}
                                        {reminder.frequency && (
                                            <span className="px-2 py-0.5 rounded-full bg-white/70 text-gray-800 border border-amber-100">{reminder.frequency}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-1">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(reminder)}
                                        className="px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(reminder)}
                                        className="text-[11px] text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => setShowSent(prev => !prev)}
                        className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sent</span>
                            {sentReminders.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{sentReminders.length}</span>
                            )}
                        </span>
                        <ChevronRight
                            size={14}
                            className={`text-gray-400 transform transition-transform ${showSent ? 'rotate-90' : ''}`}
                        />
                    </button>
                    {showSent && (
                        <div className="mt-2 space-y-2">
                            {sentReminders.length === 0 && (
                                <p className="text-gray-400 text-xs">No sent reminders yet.</p>
                            )}
                            {sentReminders.map(reminder => (
                                <div
                                    key={reminder.id}
                                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-start gap-3 opacity-80"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-medium text-gray-800 truncate">{reminder.title}</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {reminder.triggerTime && parseUTCDate(reminder.triggerTime).toLocaleString()}
                                        </p>
                                        {reminder.description && (
                                            <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{reminder.description}</p>
                                        )}
                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                                            {reminder.notify && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Email</span>
                                            )}
                                            {reminder.frequency && (
                                                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">{reminder.frequency}</span>
                                            )}
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Sent</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(reminder)}
                                            className="text-red-500 hover:text-red-700 p-1 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {reminders.length === 0 && (
                    <p className="text-gray-400 text-center text-xs">No reminders set yet.</p>
                )}
            </div>
            {confirmConfig && (
                <ConfirmModal
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    confirmLabel={confirmConfig.confirmLabel}
                    onCancel={() => setConfirmConfig(null)}
                    onConfirm={async () => {
                        const fn = confirmConfig.onConfirm;
                        setConfirmConfig(null);
                        if (fn) {
                            await fn();
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ReminderView;
