import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

const CreateSectionModal = ({ onClose, onCreated, groupId, parentId = null }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('NOTE');
    // Section-level passwords removed; no security fields needed here.

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/groups/sections', {
                title,
                type,
                parentId
            });
            onCreated();
        } catch (error) {
            console.error("Failed to create section", error);
            // Optionally set error state here and display it
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Create new section</h2>
                        <p className="mt-0.5 text-xs text-gray-500">Add a note, list, folder, or expense area to this group.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                        Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 tracking-wide">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Section name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 tracking-wide">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="NOTE">Note</option>
                            <option value="LIST">List</option>
                            <option value="GALLERY">Files</option>
                            <option value="REMINDER">Reminder</option>
                            <option value="PAYMENT">Payments</option>
                            <option value="FOLDER">Folder</option>
                        </select>
                    </div>

                    {/* Security UI removed: sections are no longer password protected */}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                        >
                            Create section
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSectionModal;
