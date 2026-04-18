import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { parseUTCDate } from '../../utils/dateUtils';
import ConfirmModal from '../ConfirmModal';
import { ChevronRight, Search, X } from 'lucide-react';

// Modal is only used for editing existing reminders
const ReminderEditModal = ({ open, onClose, onSubmit, editingReminder }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [triggerTime, setTriggerTime] = useState('');
    const [notify, setNotify] = useState(false);
    const [frequency, setFrequency] = useState('ONCE');

    useEffect(() => {
        if (!open || !editingReminder) return;
        setTitle(editingReminder.title || '');
        setDescription(editingReminder.description || '');
        if (editingReminder.triggerTime) {
            const dt = new Date(editingReminder.triggerTime + 'Z');
            const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            setTriggerTime(local);
        } else {
            setTriggerTime('');
        }
        setNotify(!!editingReminder.notify);
        setFrequency(editingReminder.frequency || 'ONCE');
    }, [open, editingReminder]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const utcTriggerTime = triggerTime
            ? new Date(triggerTime).toISOString().slice(0, 16)
            : triggerTime;
        await onSubmit({ title, description, triggerTime: utcTriggerTime, notify, frequency });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Edit reminder</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <input
                        type="text"
                        placeholder="Reminder title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none bg-gray-50"
                        required
                        autoFocus
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none bg-gray-50 resize-y min-h-[70px]"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-600">Due date &amp; time</label>
                            <input
                                type="datetime-local"
                                value={triggerTime}
                                onChange={(e) => setTriggerTime(e.target.value)}
                                className="w-full h-10 border border-gray-200 px-3 rounded-lg text-sm focus:outline-none bg-gray-50"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-gray-600">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full h-10 border border-gray-200 px-3 rounded-lg text-sm text-gray-700 focus:outline-none bg-gray-50"
                            >
                                <option value="ONCE">Once</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                        <div>
                            <p className="text-[11px] font-medium text-gray-600">Email notification</p>
                            <p className="text-[11px] text-gray-400">Email me when this reminder is due.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setNotify(n => !n)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center cursor-pointer rounded-full border transition-colors duration-200 focus:outline-none ${notify ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${notify ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                            Update reminder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReminderView = ({ sectionId }) => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [showSent, setShowSent] = useState(false);
    const [filterText, setFilterText] = useState('');

    // Inline add form state (always visible)
    const [inlineTitle, setInlineTitle] = useState('');
    const [inlineTriggerTime, setInlineTriggerTime] = useState('');
    const [inlineFrequency, setInlineFrequency] = useState('ONCE');
    const [inlineNotify, setInlineNotify] = useState(false);
    const [inlineDescription, setInlineDescription] = useState('');
    const [inlineSubmitting, setInlineSubmitting] = useState(false);

    const defaultNotify = user && typeof user.reminderEmailEnabled === 'boolean'
        ? user.reminderEmailEnabled
        : false;

    // Sync notify default when user loads
    useEffect(() => {
        setInlineNotify(defaultNotify);
    }, [defaultNotify]);

    useEffect(() => {
        fetchReminders();
    }, [sectionId]);

    const fetchReminders = async () => {
        try {
            const res = await axiosClient.get(`/groups/sections/${sectionId}/reminders`);
            setReminders(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch reminders", error);
        }
    };

    const resetInlineForm = () => {
        setInlineTitle('');
        setInlineTriggerTime('');
        setInlineFrequency('ONCE');
        setInlineNotify(defaultNotify);
        setInlineDescription('');
    };

    const handleInlineSubmit = async (e) => {
        e.preventDefault();
        if (inlineSubmitting) return;
        setInlineSubmitting(true);
        try {
            const utcTriggerTime = inlineTriggerTime
                ? new Date(inlineTriggerTime).toISOString().slice(0, 16)
                : inlineTriggerTime;
            const payload = {
                title: inlineTitle,
                description: inlineDescription,
                triggerTime: utcTriggerTime,
                notify: inlineNotify,
                frequency: inlineFrequency,
            };
            const res = await axiosClient.post(`/groups/sections/${sectionId}/reminders`, payload);
            const createdId = res.data;
            setReminders(prev => [
                {
                    id: createdId,
                    title: inlineTitle,
                    description: inlineDescription,
                    triggerTime: utcTriggerTime,
                    notify: inlineNotify,
                    frequency: inlineFrequency,
                    isSent: false,
                },
                ...prev,
            ]);
            toast.success("Reminder set!");
            resetInlineForm();
        } catch (error) {
            console.error("Failed to set reminder", error);
            toast.error("Failed to set reminder");
        } finally {
            setInlineSubmitting(false);
        }
    };

    const openEditModal = (reminder) => {
        setEditingReminder(reminder);
        setShowEditModal(true);
    };

    const handleEditSubmit = async ({ title, description, triggerTime, notify, frequency }) => {
        try {
            const payload = { title, description, triggerTime, notify, frequency };
            await axiosClient.put(`/groups/sections/reminders/${editingReminder.id}`, payload);
            await fetchReminders();
            toast.success("Reminder updated!");
            setShowEditModal(false);
            setEditingReminder(null);
        } catch (error) {
            console.error("Failed to update reminder", error);
            toast.error("Failed to update reminder");
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

    const filterFn = (r) => !filterText || r.title?.toLowerCase().includes(filterText.toLowerCase()) || r.description?.toLowerCase().includes(filterText.toLowerCase());
    const activeReminders = reminders.filter(r => !r.isSent).filter(filterFn);
    const sentReminders = reminders.filter(r => r.isSent).filter(filterFn);

    return (
        <div className="h-full flex flex-col sm:p-4">
            <div className="mb-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Reminders</h2>
                <p className="text-xs text-gray-500">Set one-off or repeating reminders for your group.</p>
            </div>

            {/* Inline add form — always visible */}
            <div className="mt-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <form onSubmit={handleInlineSubmit} className="space-y-2">
                    <input
                        type="text"
                        placeholder="Reminder title"
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none bg-gray-50"
                        required
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={inlineDescription}
                        onChange={(e) => setInlineDescription(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none bg-gray-50 resize-none"
                        rows={2}
                    />
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                        <input
                            type="datetime-local"
                            value={inlineTriggerTime}
                            onChange={(e) => setInlineTriggerTime(e.target.value)}
                            className="flex-1 h-9 border border-gray-200 px-3 rounded-lg text-sm focus:outline-none bg-gray-50"
                            required
                        />
                        <select
                            value={inlineFrequency}
                            onChange={(e) => setInlineFrequency(e.target.value)}
                            className="h-9 flex-1 border border-gray-200 px-3 rounded-lg text-sm text-gray-700 focus:outline-none bg-gray-50"
                        >
                            <option value="ONCE">Once</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <button
                                type="button"
                                onClick={() => setInlineNotify(n => !n)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none ${inlineNotify ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${inlineNotify ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            <span className="text-[11px] text-gray-600">Email me when due</span>
                        </label>
                        <button
                            type="submit"
                            disabled={inlineSubmitting}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 ml-auto"
                        >
                            {inlineSubmitting ? 'Adding…' : 'Add reminder'}
                        </button>
                    </div>
                </form>
            </div>

            {reminders.length > 4 && (
                <div className="relative my-3 max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        placeholder="Filter reminders…"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 mt-3">
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
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">{reminder.title}</h3>
                                        <p className="text-[11px] text-gray-600 mt-0.5">
                                            {reminder.triggerTime && parseUTCDate(reminder.triggerTime)?.toLocaleString()}
                                        </p>
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
                                        onClick={() => openEditModal(reminder)}
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
                                            {reminder.triggerTime && parseUTCDate(reminder.triggerTime)?.toLocaleString()}
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
            </div>

            <ReminderEditModal
                open={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingReminder(null); }}
                onSubmit={handleEditSubmit}
                editingReminder={editingReminder}
            />

            {confirmConfig && (
                <ConfirmModal
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    confirmLabel={confirmConfig.confirmLabel}
                    onCancel={() => setConfirmConfig(null)}
                    onConfirm={async () => {
                        const fn = confirmConfig.onConfirm;
                        setConfirmConfig(null);
                        if (fn) await fn();
                    }}
                />
            )}
        </div>
    );
};

export default ReminderView;
