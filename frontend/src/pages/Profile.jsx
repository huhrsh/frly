import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        pfpUrl: '',
        reminderEmailEnabled: true,
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosClient.get('/users/me');
                const data = response.data;
                setForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    contact: data.contact || '',
                    pfpUrl: data.pfpUrl || '',
                    reminderEmailEnabled: data.reminderEmailEnabled !== undefined ? data.reminderEmailEnabled : true,
                });
                updateUser({
                    id: data.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    contact: data.contact,
                    pfpUrl: data.pfpUrl,
                    reminderEmailEnabled: data.reminderEmailEnabled,
                    token: user?.token,
                });
            } catch (error) {
                console.error('Failed to load profile', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        const nextValue = type === 'checkbox' ? checked : value;
        setForm((prev) => ({ ...prev, [name]: nextValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosClient.put('/users/me', {
                firstName: form.firstName,
                lastName: form.lastName,
                contact: form.contact,
                pfpUrl: form.pfpUrl,
                reminderEmailEnabled: form.reminderEmailEnabled,
            });
            const updated = res.data;
            setForm({
                firstName: updated.firstName || '',
                lastName: updated.lastName || '',
                email: updated.email || '',
                contact: updated.contact || '',
                pfpUrl: updated.pfpUrl || '',
                reminderEmailEnabled: updated.reminderEmailEnabled !== undefined ? updated.reminderEmailEnabled : true,
            });
            updateUser({
                id: updated.id,
                email: updated.email,
                firstName: updated.firstName,
                lastName: updated.lastName,
                contact: updated.contact,
                pfpUrl: updated.pfpUrl,
                reminderEmailEnabled: updated.reminderEmailEnabled,
            });
            toast.success('Profile updated');
        } catch (error) {
            console.error('Failed to update profile', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axiosClient.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const updated = res.data;
            setForm((prev) => ({
                ...prev,
                pfpUrl: updated.pfpUrl || '',
            }));
            updateUser({
                id: updated.id,
                email: updated.email,
                firstName: updated.firstName,
                lastName: updated.lastName,
                contact: updated.contact,
                pfpUrl: updated.pfpUrl,
            });
            toast.success('Profile picture updated');
        } catch (error) {
            console.error('Failed to upload avatar', error);
            toast.error('Failed to upload profile picture');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSendResetEmail = async () => {
        try {
            await axiosClient.post('/auth/forgot-password', { email: form.email });
            toast.success('Password reset email sent');
        } catch (error) {
            console.error('Failed to send reset email', error);
            toast.error('Failed to send reset email');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Account</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage your personal details, avatar and security.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSendResetEmail}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-200 text-[11px] font-medium text-red-600 hover:bg-red-50"
                >
                    Send password reset email
                </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center sm:items-start w-full sm:w-40">
                        <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100 text-blue-600 font-semibold text-xl mb-3">
                            {form.pfpUrl ? (
                                <img src={form.pfpUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span>{(form.firstName?.[0] || form.email?.[0] || '?').toUpperCase()}</span>
                            )}
                        </div>
                        <label className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-[11px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <span>{uploading ? 'Uploading...' : 'Change picture'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-2 py-1.5"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-2 py-1.5"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                disabled
                                className="block w-full rounded-md border-gray-200 bg-gray-50 text-gray-500 shadow-sm text-sm px-2 py-1.5 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                            <input
                                type="text"
                                name="contact"
                                value={form.contact}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-2 py-1.5"
                                placeholder="Phone or other contact info"
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <input
                                id="reminderEmailEnabled"
                                name="reminderEmailEnabled"
                                type="checkbox"
                                checked={!!form.reminderEmailEnabled}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="reminderEmailEnabled" className="text-xs text-gray-700">
                                Email me when my reminders are due
                            </label>
                        </div>

                        {/* pfpUrl is managed via upload; no need to show raw URL field */}
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
