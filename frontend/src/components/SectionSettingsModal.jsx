import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const SectionSettingsModal = ({ sectionId, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // No-op for now: security settings are deprecated.
            toast.info("Section security is no longer configurable.");
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update settings", error);
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-bold mb-4">Section Settings</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">
                        Section-level passwords have been removed. Access is controlled by group membership and roles.
                    </p>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SectionSettingsModal;
