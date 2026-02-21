import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ReminderView = ({ sectionId }) => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderDescription, setNewReminderDescription] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('');
    const [notify, setNotify] = useState(false);
    const [frequency, setFrequency] = useState('ONCE');
    const [editingId, setEditingId] = useState(null);

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
            // If 403, parent GroupView should have handled it or we can show error here
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

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/groups/sections/reminders/${id}`);
            setReminders(reminders.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete reminder", error);
        }
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

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Reminders</h2>
            <p className="text-xs text-gray-500 mb-4">Create time-based reminders. You can choose if they should send notifications and how often.</p>

            <form onSubmit={handleAddReminder} className="mb-4 bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid gap-3 sm:grid-cols-2">
                    <input
                        type="text"
                        placeholder="Reminder Title"
                        value={newReminderTitle}
                        onChange={(e) => setNewReminderTitle(e.target.value)}
                        className="border px-3 py-2 rounded text-sm"
                        required
                    />
                    <div className="space-y-2">
                        <input
                            type="datetime-local"
                            value={newReminderTime}
                            onChange={(e) => setNewReminderTime(e.target.value)}
                            className="border px-3 py-2 rounded text-sm w-full"
                            required
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <input
                                id="notify-toggle"
                                type="checkbox"
                                checked={notify}
                                onChange={(e) => setNotify(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="notify-toggle">Email me a reminder for this</label>
                        </div>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="border px-3 py-2 rounded text-xs text-gray-700 w-full"
                        >
                            <option value="ONCE">Once</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <textarea
                            placeholder="Description (optional)"
                            value={newReminderDescription}
                            onChange={(e) => setNewReminderDescription(e.target.value)}
                            className="border px-3 py-2 rounded text-sm w-full"
                            rows="2"
                        />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="mr-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
                            {editingId ? 'Update Reminder' : 'Set Reminder'}
                        </button>
                    </div>
                </div>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                {reminders.map(reminder => (
                    <div key={reminder.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-800 truncate">{reminder.title}</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {reminder.triggerTime && new Date(reminder.triggerTime).toLocaleString()}
                            </p>
                            {reminder.description && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{reminder.description}</p>}
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                                {reminder.notify && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Email on</span>
                                )}
                                {reminder.frequency && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-100">{reminder.frequency}</span>
                                )}
                                {reminder.isSent && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Sent</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {!reminder.isSent && (
                                <button
                                    type="button"
                                    onClick={() => startEdit(reminder)}
                                    className="text-blue-500 hover:text-blue-700 p-1 text-xs"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleDelete(reminder.id)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {reminders.length === 0 && <p className="text-gray-400 text-center text-xs">No reminders set yet.</p>}
            </div>
        </div>
    );
};

export default ReminderView;
