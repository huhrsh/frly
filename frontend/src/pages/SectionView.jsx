import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroupDetails, setGroupId } from '../redux/slices/groupSlice';
import axiosClient from '../api/axiosClient';
import NoteView from '../components/sections/NoteView';
import ListView from '../components/sections/ListView';
import GalleryView from '../components/sections/GalleryView';
import ReminderView from '../components/sections/ReminderView';
import FolderView from '../components/sections/FolderView';
import PaymentView from '../components/sections/PaymentView';
import { toast } from 'react-toastify';

const SectionView = () => {
    const { groupId, sectionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentGroup, loading: groupLoading } = useSelector((state) => state.group);

    const [sections, setSections] = useState([]);
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Ensure group context is set and details loaded
    useEffect(() => {
        const id = parseInt(groupId, 10);
        if (!currentGroup || currentGroup.id !== id) {
            dispatch(setGroupId(id));
            dispatch(fetchGroupDetails(groupId));
        }
    }, [groupId, currentGroup, dispatch]);

    // Fetch sections and resolve the one we care about
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axiosClient.get('/groups/sections');
                const list = Array.isArray(res.data) ? res.data : [];
                setSections(list);
                const found = list.find((s) => String(s.id) === String(sectionId));
                if (!found) {
                    toast.error('Section not found');
                }
                setSection(found || null);
            } catch (err) {
                console.error('Failed to load section', err);
                toast.error('Failed to load section');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [sectionId]);

    const renderContent = () => {
        if (!section) {
            return (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    Section not found.
                </div>
            );
        }

        switch (section.type) {
            case 'NOTE':
                return <NoteView sectionId={section.id} />;
            case 'LIST':
                return <ListView sectionId={section.id} />;
            case 'GALLERY':
                return <GalleryView sectionId={section.id} />;
            case 'REMINDER':
                return <ReminderView sectionId={section.id} />;
            case 'PAYMENT':
                return <PaymentView sectionId={section.id} />;
            case 'FOLDER':
                return (
                    <FolderView
                        sectionId={section.id}
                        allSections={sections}
                        onSelectSection={(s) => navigate(`/groups/${groupId}/sections/${s.id}`)}
                        onOpenCreateModal={() => toast.info('Use workspace view to manage folder structure')}
                    />
                );
            default:
                return <div className="p-4 text-sm text-gray-500">Unknown section type.</div>;
        }
    };

    const typeLabel = section?.type === 'NOTE'
        ? 'Notes'
        : section?.type === 'LIST'
        ? 'Lists'
        : section?.type === 'GALLERY'
        ? 'Gallery'
        : section?.type === 'REMINDER'
        ? 'Reminders'
        : section?.type === 'PAYMENT'
        ? 'Payments'
        : 'Folder';

    if (groupLoading && loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate(`/groups/${groupId}`)}
                        className="text-[11px] text-gray-500 hover:text-gray-800 mb-1"
                    >
                        ← Back to group
                    </button>
                    <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {section?.title || 'Section'}
                    </h1>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                        {currentGroup && (
                            <span className="truncate">in {currentGroup.displayName}</span>
                        )}
                        {section && (
                            <span
                                className={`px-2 py-0.5 rounded-full border ${
                                    section.type === 'NOTE'
                                        ? 'bg-blue-50 border-blue-100 text-blue-700'
                                        : section.type === 'LIST'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        : section.type === 'GALLERY'
                                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                                        : section.type === 'REMINDER'
                                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                            >
                                {typeLabel}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 h-[60vh] sm:h-[65vh] overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};

export default SectionView;
