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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-bold mb-4">Create New Section</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSectionModal;
