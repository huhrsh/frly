import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroupDetails, setGroupId } from '../redux/slices/groupSlice';
import axiosClient from '../api/axiosClient';
import NoteView from '../components/sections/NoteView';
import ListView from '../components/sections/ListView';
import GalleryView from '../components/sections/GalleryView';
import ReminderView from '../components/sections/ReminderView';
import CalendarView from '../components/sections/CalendarView';
import FolderView from '../components/sections/FolderView';
import PaymentView from '../components/sections/PaymentView';
import CreateSectionModal from '../components/CreateSectionModal';
import { toast } from 'react-toastify';
import { Trash2, ArrowLeft, Home, LayoutPanelLeft, LayoutGrid, Users, Pencil, Check, X, ArrowUpDown, RefreshCw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import LinksSection from '../components/sections/LinksSection';
import ReorderSectionsModal from '../components/ReorderSectionsModal';

const SectionView = () => {
    const { groupId, sectionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentGroup, loading: groupLoading } = useSelector((state) => state.group);

    const [sections, setSections] = useState([]);
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createModalParentId, setCreateModalParentId] = useState(null);
    const [renamingSectionId, setRenamingSectionId] = useState(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [showReorderModal, setShowReorderModal] = useState(false);

    // Ensure group context is set and details loaded
    useEffect(() => {
        const id = parseInt(groupId, 10);
        if (!currentGroup || currentGroup.id !== id) {
            dispatch(setGroupId(id));
            dispatch(fetchGroupDetails(groupId));
        }
    }, [groupId, currentGroup, dispatch]);

    // Ensure new sections open at the top of the viewport
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [groupId, sectionId]);

    // Fetch sections and resolve the one we care about
    const loadSection = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/groups/sections');
            const list = Array.isArray(res.data) ? res.data : [];
            setSections(list);
            const found = list.find((s) => String(s.id) === String(sectionId));
            if (!found) toast.error('Section not found');
            setSection(found || null);
        } catch (err) {
            console.error('Failed to load section', err);
            toast.error('Failed to load section');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSection();
    }, [sectionId]);

    const handleBackPrevious = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        localStorage.removeItem('currentGroupId');
        navigate('/');
        localStorage.removeItem('currentGroupId');
    };

    const handleGoToGroup = () => {
        // On mobile, always send users to the overview (BENTO) view.
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            navigate(`/groups/${groupId}?view=BENTO`);
            return;
        }

        const pref = currentGroup?.viewPreference;
        const normalized = pref === 'BENTO' || pref === 'WORKSPACE' ? pref : null;
        const suffix = normalized ? `?view=${normalized}` : '';
        navigate(`/groups/${groupId}${suffix}`);
    };

    const handleGoToWorkspace = async () => {
        if (!section) return;
        try {
            await axiosClient.patch(`/groups/${groupId}/view-preference`, { viewPreference: 'WORKSPACE' });
            // Keep currentGroup.viewPreference in sync so "Back to groups" and
            // future loads respect the updated choice immediately.
            dispatch(fetchGroupDetails(groupId));
        } catch (err) {
            console.error('Failed to update view preference to WORKSPACE', err);
        }
        navigate(`/groups/${groupId}?view=WORKSPACE&section=${section.id}`);
    };

    const handleDeleteSection = () => {
        if (!section) return;
        if (!currentGroup || currentGroup.currentUserRole !== 'ADMIN') {
            toast.error('Only admins can delete sections');
            return;
        }
        setConfirmConfig({
            title: 'Delete section?',
            message: `Delete section "${section.title}" and its contents?`,
            confirmLabel: 'Delete section',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/sections/${section.id}`);
                    toast.success('Section deleted');
                    navigate(`/groups/${groupId}`);
                } catch (err) {
                    console.error('Failed to delete section', err);
                    toast.error('Failed to delete section');
                }
            }
        });
    };

    const handleStartRenameSection = () => {
        if (!section) return;
        setRenamingSectionId(section.id);
        setRenameTitle(section.title || '');
    };

    const handleCancelRenameSection = () => {
        setRenamingSectionId(null);
        setRenameTitle('');
    };

    const handleSubmitRenameSection = async () => {
        if (!section) return;
        const trimmed = (renameTitle || '').trim();
        if (!trimmed) {
            toast.error('Title cannot be empty');
            return;
        }

        try {
            await axiosClient.patch(`/groups/sections/${section.id}/title`, { title: trimmed });
            setSections(prev => prev.map(s => (s.id === section.id ? { ...s, title: trimmed } : s)));
            setSection(prev => (prev ? { ...prev, title: trimmed } : prev));
            toast.success('Section renamed');
            setRenamingSectionId(null);
            setRenameTitle('');
        } catch (err) {
            console.error('Failed to rename section', err);
            const msg = err.response?.data?.message || 'Failed to rename section';
            toast.error(msg);
        }
    };

    const handleOpenCreateModal = (parentId = null) => {
        setCreateModalParentId(parentId);
        setShowCreateModal(true);
    };

    const handleSectionCreated = async () => {
        setShowCreateModal(false);
        setCreateModalParentId(null);
        // Refresh sections so the new child appears in the folder view
        try {
            const res = await axiosClient.get('/groups/sections');
            const list = Array.isArray(res.data) ? res.data : [];
            setSections(list);
            const found = list.find((s) => String(s.id) === String(sectionId));
            setSection(found || null);
        } catch (err) {
            console.error('Failed to refresh sections after create', err);
        }
    };

    const handleApplyFolderReorder = async (orderedIds) => {
        if (!section) return;

        const parentId = section.id;
        const childSections = sections.filter((s) => s.parentId === parentId);
        if (!childSections.length) return;

        const reordered = orderedIds
            .map((id) => childSections.find((s) => s.id === id))
            .filter(Boolean);

        const otherSections = sections.filter((s) => s.parentId !== parentId);
        setSections([...reordered, ...otherSections]);

        try {
            await axiosClient.patch('/groups/sections/reorder', orderedIds);
        } catch (error) {
            console.error('Failed to reorder sections', error);
            toast.error('Failed to reorder sections');
            try {
                const res = await axiosClient.get('/groups/sections');
                const list = Array.isArray(res.data) ? res.data : [];
                setSections(list);
            } catch (err) {
                console.error('Failed to refresh sections', err);
            }
        }
    };

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
                return <ListView sectionId={section.id} section={section} />;
            case 'GALLERY':
                return <GalleryView sectionId={section.id} />;
            case 'REMINDER':
                return <ReminderView sectionId={section.id} />;
            case 'LINKS':
                return <LinksSection sectionId={section.id} />;
            case 'PAYMENT':
                return <PaymentView sectionId={section.id} />;
            case 'CALENDAR':
                return <CalendarView sectionId={section.id} />;
            case 'FOLDER':
                return (
                    <FolderView
                        sectionId={section.id}
                        allSections={sections}
                        onSelectSection={(s) => navigate(`/groups/${groupId}/sections/${s.id}`)}
                        onOpenCreateModal={currentGroup?.currentUserRole === 'ADMIN' ? handleOpenCreateModal : undefined}
                    />
                );
            default:
                return <div className="p-4 text-sm text-gray-500">Unknown section type.</div>;
        }
    };

    const typeLabel = section?.type === 'NOTE'
        ? 'Note'
        : section?.type === 'LIST'
            ? 'Checklist'
            : section?.type === 'GALLERY'
                ? 'Files'
                : section?.type === 'REMINDER'
                    ? 'Reminder'
                    : section?.type === 'PAYMENT'
                        ? 'Expenses'
                        : section?.type === 'CALENDAR'
                            ? 'Calendar'
                            : section?.type === 'LINKS'
                                ? 'Links'
                                : 'Folder';

    if (groupLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-[70vh]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 ">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBackPrevious}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                            >
                                <ArrowLeft size={14} />
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToGroup}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                            >
                                <Home size={14} />
                                Home
                            </button>
                            <button
                                type="button"
                                onClick={handleGoHome}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                            >
                                <Users size={14} />
                                Back to groups
                            </button>
                        </div>
                        {section && (
                            <div className="flex items-center gap-2">
                                {currentGroup?.currentUserRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteSection}
                                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                                    >
                                        <Trash2 size={14} />
                                        <span className="hidden sm:inline">Delete section</span>
                                        <span className="sm:hidden">Delete</span>
                                    </button>
                                )}
                                {section?.type === 'FOLDER' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReorderModal(true)}
                                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        <ArrowUpDown size={14} />
                                        Reorder
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={loadSection}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                                    aria-label="Refresh section"
                                    title="Refresh section"
                                >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                    <span className="text-gray-700">Refresh</span>
                                </button>
                                <div className="hidden sm:inline-flex gap-1 items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm">
                                    <button
                                        type="button"
                                        onClick={handleGoToWorkspace}
                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 sm:py-2 rounded-full font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    >
                                        <LayoutPanelLeft size={14} />
                                        Workspace
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 sm:py-2 rounded-full font-medium bg-blue-600 text-white shadow"
                                    >
                                        <LayoutGrid size={14} />
                                        Overview
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="min-w-0 ">
                            {section ? (
                                <>
                                    {renamingSectionId === section.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="w-40 sm:w-64 lg:w-80 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                value={renameTitle}
                                                onChange={(e) => setRenameTitle(e.target.value)}
                                                maxLength={120}
                                                autoFocus
                                            />
                                            {currentGroup?.currentUserRole === 'ADMIN' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handleSubmitRenameSection}
                                                        className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelRenameSection}
                                                        className="inline-flex items-center px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                                {section.title}
                                            </h1>
                                            {currentGroup?.currentUserRole === 'ADMIN' && (
                                                <button
                                                    type="button"
                                                    onClick={handleStartRenameSection}
                                                    className="inline-flex items-center justify-center p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                                                    aria-label="Rename section"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                    Section
                                </h1>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-xs sm:text-[13px] text-gray-500">
                                {currentGroup && (
                                    <span className="truncate">in {currentGroup.displayName}</span>
                                )}
                                {section && (
                                    <span
                                        className={`px-2 py-0.5 rounded-full border ${section.type === 'NOTE'
                                            ? 'bg-blue-50 border-blue-100 text-blue-700'
                                            : section.type === 'LIST'
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : section.type === 'GALLERY'
                                                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                                                    : section.type === 'REMINDER'
                                                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                        : section.type === 'PAYMENT'
                                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                            : section.type === 'CALENDAR'
                                                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                                : section.type === 'LINKS' ? 'bg-blue-50 border-blue-100 text-blue-700'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {typeLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    {renderContent()}
                </div>
            </div>

            {showCreateModal && (
                <CreateSectionModal
                    groupId={groupId}
                    parentId={createModalParentId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleSectionCreated}
                />
            )}

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
            {section && section.type === 'FOLDER' && (
                <ReorderSectionsModal
                    open={showReorderModal}
                    title="Reorder items in folder"
                    items={sections.filter((s) => s.parentId === section.id)}
                    onClose={() => setShowReorderModal(false)}
                    onSave={handleApplyFolderReorder}
                />
            )}
        </div>
    );
};

export default SectionView;
