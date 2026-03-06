import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateGroup = () => {
    const [displayName, setDisplayName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Generate a simple internal ID from the display name so users
            // don’t have to think about unique system names.
            const slug = (displayName || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            await axiosClient.post('/groups', { name: slug || undefined, displayName });
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to create group", error);
            toast.error('Failed to create group. Please try again.');
        }
    };

        return (
		<div className="min-h-[calc(100dvh-8rem)] bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Create a new group
                        </h1>
                        <p className="text-sm text-gray-700 max-w-md">
                            Groups are shared spaces where you and your members can collaborate with notes, lists, galleries and reminders.
                        </p>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">Naming tips</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Use a clear, human-friendly name your group will recognise.</li>
                                <li>Examples: "PG flatmates", "Family home", "Goa trip".</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8 w-full">
                    <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
                        New Group
                    </h2>
                    <p className="mt-1 text-xs text-center text-slate-500">Set up a space and invite others with an invite code.</p>

                    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium leading-6 text-slate-900">
                                Group name
                            </label>
                            <p className="mt-1 text-xs text-slate-500">This is what members will see in their dashboard.</p>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                placeholder="e.g. PG flatmates, Family home, Goa trip"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                        >
                            Create group
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateGroup;
