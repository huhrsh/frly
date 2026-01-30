import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const NoteView = ({ sectionId }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [version, setVersion] = useState(null);
    const [lastEditedInfo, setLastEditedInfo] = useState(null);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await axiosClient.get(`/groups/sections/${sectionId}/note`);
                const data = res.data || {};
                setContent(data.content || '');
                setVersion(data.version ?? null);
                if (data.lastEditedAt || data.lastEditedByName) {
                    setLastEditedInfo({
                        at: data.lastEditedAt,
                        by: data.lastEditedByName || 'Someone'
                    });
                } else {
                    setLastEditedInfo(null);
                }
            } catch (error) {
                console.error("Failed to fetch note", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [sectionId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { content };
            if (version !== null && version !== undefined) {
                payload.version = version;
            }

            const res = await axiosClient.put(`/groups/sections/${sectionId}/note`, payload);
            const data = res.data || {};
            setContent(data.content || '');
            setVersion(data.version ?? null);
            if (data.lastEditedAt || data.lastEditedByName) {
                setLastEditedInfo({
                    at: data.lastEditedAt,
                    by: data.lastEditedByName || 'Someone'
                });
            } else {
                setLastEditedInfo(null);
            }
            toast.success('Note saved');
        } catch (error) {
            console.log(error);
            if (error?.response?.status === 409 && error.response.data?.latestNote) {
                // const latest = error.response.data.latestNote;
                toast.error('Note was updated elsewhere.');
                // setContent(latest.content || '');
                // setVersion(latest.version ?? null);
                // if (latest.lastEditedAt || latest.lastEditedByName) {
                //     setLastEditedInfo({
                //         at: latest.lastEditedAt,
                //         by: latest.lastEditedByName || 'Someone'
                //     });
                // } else {
                //     setLastEditedInfo(null);
                // }
            } else {
                console.error("Failed to save note", error);
                toast.error('Failed to save note');
            }
        } finally {
            setSaving(false);
        }
    };

    // Simple auto-save simulation could be added here with debounce

    if (loading) return <div className="p-4 text-sm text-gray-500">Loading note...</div>;

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Note</h2>
                    <p className="text-xs text-gray-500">Use this space for free-form text and ideas.</p>
                </div>
                {lastEditedInfo && (
                    <div className="text-right mr-3 hidden sm:block">
                        <p className="text-[10px] text-gray-400">Last edited by {lastEditedInfo.by}</p>
                        {lastEditedInfo.at && (
                            <p className="text-[10px] text-gray-400">
                                at {new Date(lastEditedInfo.at).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium transition disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-gray-800 bg-gray-50"
                placeholder="Start typing your note..."
            />
        </div>
    );
};

export default NoteView;
