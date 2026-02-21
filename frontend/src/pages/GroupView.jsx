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
import CreateSectionModal from '../components/CreateSectionModal';
import SidebarSection from '../components/SidebarSection';
import SectionSettingsModal from '../components/SectionSettingsModal';
import BentoGrid from '../components/BentoGrid';
import { useSectionPreviews } from '../hooks/useSectionPreviews';
import { toast } from 'react-toastify';
import { Settings, Copy } from 'lucide-react';

const GroupView = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentGroup, loading: groupLoading } = useSelector((state) => state.group);

    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [createModalParentId, setCreateModalParentId] = useState(null);

    // Section-level passwords have been removed; keep placeholder state for potential future use
    const [unlockedSections, setUnlockedSections] = useState({});

    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    const [viewMode, setViewMode] = useState('WORKSPACE'); // WORKSPACE | BENTO

    // We only fetch previews for root sections in the main view
    const rootSections = sections.filter(s => !s.parentId);
    const sectionPreviews = useSectionPreviews(viewMode === 'BENTO' ? rootSections : []);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            if (typeof window !== 'undefined') {
                setIsMobile(window.innerWidth < 768);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const id = parseInt(groupId);
        // Case 1: No group loaded or different group loaded
        if (!currentGroup || currentGroup.id !== id) {
            // Set ID immediately in Redux (and thus localStorage) to help with race conditions
            dispatch(setGroupId(id));
            dispatch(fetchGroupDetails(groupId));
        }
    }, [groupId, dispatch, currentGroup]);

    // Initialise view mode from the group's stored preference when available
    useEffect(() => {
        if (!currentGroup) return;
        if (isMobile) {
            setViewMode('BENTO');
        } else if (currentGroup.viewPreference) {
            setViewMode(currentGroup.viewPreference);
        }
    }, [currentGroup, isMobile]);

    // Separate effect to fetch sections ONLY when we are sure the group is ready
    useEffect(() => {
        const id = parseInt(groupId);
        // Ensure currentGroup is loaded and matches the URL groupId before fetching sections
        if (currentGroup && currentGroup.id === id) {
            fetchSections();
        }
    }, [currentGroup, groupId]);

    useEffect(() => {
        const id = parseInt(groupId);
        if (currentGroup && currentGroup.id === id && currentGroup.currentUserRole === 'ADMIN') {
            fetchPendingRequests();
        }
    }, [currentGroup, groupId]);

    // Load lightweight previews for bento view (notes, lists, reminders) when needed
    // Logic moved to useSectionPreviews hook

    const fetchSections = async () => {
        setSectionsLoading(true);
        try {
            const response = await axiosClient.get('/groups/sections');
            setSections(response.data);
            // Default select first section if none selected
            if (!selectedSection && response.data.length > 0) {
                // Try to find a root section to select first
                const rootSection = response.data.find(s => !s.parentId);
                if (rootSection) {
                    setSelectedSection(rootSection);
                } else {
                    setSelectedSection(response.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch sections", error);
            toast.error("Failed to load sections.");
        } finally {
            setSectionsLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        setPendingLoading(true);
        try {
            const response = await axiosClient.get(`/groups/${groupId}/join-requests`);
            setPendingRequests(response.data || []);
        } catch (error) {
            console.error('Failed to fetch join requests', error);
            toast.error('Failed to load join requests.');
        } finally {
            setPendingLoading(false);
        }
    };

    const handleSectionCreated = () => {
        setShowCreateModal(false);
        setCreateModalParentId(null);
        fetchSections();
        toast.success("Section created successfully!");
    };

    const handleChangeViewMode = async (mode) => {
        if (isMobile) return; // On mobile we always stay in BENTO
        if (!currentGroup || mode === viewMode) return;
        setViewMode(mode);
        try {
            await axiosClient.patch(`/groups/${currentGroup.id}/view-preference`, { viewPreference: mode });
        } catch (error) {
            console.error('Failed to update view preference', error);
        }
    };

    const handleOpenCreateModal = (parentId = null) => {
        setCreateModalParentId(parentId);
        setShowCreateModal(true);
    };

    const handleApproveRequest = async (memberId) => {
        try {
            await axiosClient.patch(`/groups/members/${memberId}/approve`);
            setPendingRequests(prev => prev.filter(r => r.memberId !== memberId));
            toast.success('Member approved successfully.');
        } catch (error) {
            console.error('Failed to approve member', error);
            toast.error('Failed to approve member.');
        }
    };

    const renderSectionContent = () => {
        if (!selectedSection) {
            return (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center text-sm text-gray-500">
                        <p className="font-medium text-gray-700">No section selected</p>
                        <p className="mt-1 text-xs text-gray-400">Choose a section from the sidebar to start working in this group.</p>
                    </div>
                </div>
            );
        }

        switch (selectedSection.type) {
            case 'NOTE': return <NoteView sectionId={selectedSection.id} />;
            case 'LIST': return <ListView sectionId={selectedSection.id} />;
            case 'GALLERY': return <GalleryView sectionId={selectedSection.id} />;
            case 'REMINDER': return <ReminderView sectionId={selectedSection.id} />;
            case 'PAYMENT': return <PaymentView sectionId={selectedSection.id} />;
            case 'FOLDER': return (
                <FolderView
                    sectionId={selectedSection.id}
                    allSections={sections}
                    onSelectSection={setSelectedSection}
                    onOpenCreateModal={handleOpenCreateModal}
                />
            );
            default: return <div className="p-4">Unknown Type</div>;
        }
    };

    if (groupLoading) return <div className="p-10 flex justify-center">Loading Group...</div>;



    const renderViewToggle = () => (
        <div className="hidden md:inline-flex rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm">
            <button
                type="button"
                onClick={() => handleChangeViewMode('WORKSPACE')}
                className={`px-3 py-1 rounded-full font-medium ${viewMode === 'WORKSPACE'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
            >
                Workspace
            </button>
            <button
                type="button"
                onClick={() => handleChangeViewMode('BENTO')}
                className={`px-3 py-1 rounded-full font-medium ${viewMode === 'BENTO'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
            >
                Overview
            </button>
        </div>
    );

    // WORKSPACE VIEW: sidebar + focused section workspace
    if (viewMode === 'WORKSPACE') {
        return (
            <div className="flex min-h-screen bg-gray-50 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-10">
                    <div className="p-4 border-b">
                        <h1 className="font-bold text-lg text-gray-800 truncate">{currentGroup?.displayName}</h1>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span>Code:</span>
                                <span className="font-mono text-[11px] uppercase bg-gray-50 px-1.5 py-0.5 rounded text-gray-800">{currentGroup?.inviteCode}</span>
                            </div>
                            {currentGroup?.inviteCode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentGroup.inviteCode).then(() => {
                                            toast.success('Invite code copied');
                                        }).catch(() => {
                                            toast.error('Failed to copy');
                                        });
                                    }}
                                    className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    aria-label="Copy invite code"
                                >
                                    <Copy size={12} />
                                </button>
                            )}
                        </div>
                        {currentGroup?.storageLimit && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(100, (currentGroup.storageUsage / currentGroup.storageLimit) * 100)}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <nav className="space-y-1">
                            {sectionsLoading ? (
                                <div className="text-center text-gray-400 text-sm py-4">Loading sections...</div>
                            ) : (
                                rootSections.map(section => (
                                    <SidebarSection
                                        key={section.id}
                                        section={section}
                                        allSections={sections}
                                        selectedSection={selectedSection}
                                        onSelect={setSelectedSection}
                                    />
                                ))
                            )}
                        </nav>
                    </div>

                    <div className="p-4 border-t">
                        {currentGroup?.currentUserRole === 'ADMIN' && (
                            <div className="mb-3 text-xs text-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold">Join Requests</span>
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                        {pendingLoading ? '…' : pendingRequests.length}
                                    </span>
                                </div>
                                {pendingRequests.length === 0 && !pendingLoading ? (
                                    <p className="text-gray-400 text-[11px]">No pending requests</p>
                                ) : (
                                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                                        {pendingRequests.map(req => (
                                            <li key={req.memberId} className="flex items-center justify-between text-[11px]">
                                                <span className="truncate mr-2">
                                                    {req.firstName} {req.lastName}
                                                </span>
                                                <button
                                                    onClick={() => handleApproveRequest(req.memberId)}
                                                    className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Approve
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => handleOpenCreateModal(null)}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                            + New Section
                        </button>
                        {/* Link to dashboard or something could go here */}
                        {selectedSection && selectedSection.parentId && (
                            <button
                                onClick={() => {
                                    // Find parent
                                    const parent = sections.find(s => s.id === selectedSection.parentId);
                                    if (parent) setSelectedSection(parent);
                                }}
                                className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
                            >
                                ↑ Up to Parent Folder
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden flex flex-col w-full">
                    <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
                        <div className="min-w-0">
                            {selectedSection ? (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                            {selectedSection.title}
                                        </h2>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${selectedSection.type === 'NOTE' ? 'bg-blue-50 border-blue-100 text-blue-700'
                                            : selectedSection.type === 'LIST' ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : selectedSection.type === 'GALLERY' ? 'bg-rose-50 border-rose-100 text-rose-700'
                                                    : selectedSection.type === 'REMINDER' ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}>
                                            {selectedSection.type === 'NOTE' ? 'Notes'
                                                : selectedSection.type === 'LIST' ? 'Lists'
                                                    : selectedSection.type === 'GALLERY' ? 'Files'
                                                        : selectedSection.type === 'REMINDER' ? 'Reminders'
                                                            : 'Folder'}
                                        </span>
                                    </div>
                                    {selectedSection.parentId && (
                                        <button
                                            onClick={() => {
                                                const parent = sections.find(s => s.id === selectedSection.parentId);
                                                if (parent) setSelectedSection(parent);
                                            }}
                                            className="mt-1 text-[11px] text-gray-500 hover:text-gray-700"
                                        >
                                            ↑ Back to parent folder
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">Workspace</h2>
                                    <p className="text-xs text-gray-500">Select a section from the sidebar to start.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedSection && currentGroup?.currentUserRole === 'ADMIN' && (
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    className="hidden sm:inline-flex items-center justify-center p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                                    title="Section Settings"
                                >
                                    <Settings size={18} />
                                </button>
                            )}
                            {renderViewToggle()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                        <div className={`h-full bg-white rounded-xl shadow-sm border overflow-hidden ${selectedSection
                            ? selectedSection.type === 'NOTE' ? 'border-blue-100'
                                : selectedSection.type === 'LIST' ? 'border-emerald-100'
                                    : selectedSection.type === 'GALLERY' ? 'border-rose-100'
                                        : selectedSection.type === 'REMINDER' ? 'border-amber-100'
                                            : 'border-gray-100'
                            : 'border-gray-100'
                            }`}>
                            {renderSectionContent()}
                        </div>
                    </div>
                </main>

                {showCreateModal && (
                    <CreateSectionModal
                        groupId={groupId}
                        parentId={createModalParentId}
                        onClose={() => setShowCreateModal(false)}
                        onCreated={handleSectionCreated}
                    />
                )}

                {showSettingsModal && selectedSection && (
                    <SectionSettingsModal
                        sectionId={selectedSection.id}
                        onClose={() => setShowSettingsModal(false)}
                        onUpdate={fetchSections}
                    />
                )}
            </div>
        );
    }

    // BENTO / OVERVIEW VIEW: grid of sections with quick info
    return (
        <div className="min-h-screen bg-gray-50 px-2 sm:px-4 py-4 flex flex-col">
            <div className="max-w-7xl mx-auto space-y-6 flex-1 w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{currentGroup?.displayName}</h1>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <span>Code:</span>
                                <span className="font-mono text-[11px] uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{currentGroup?.inviteCode}</span>
                                {currentGroup?.inviteCode && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(currentGroup.inviteCode || '').then(() => {
                                                toast.success('Invite code copied');
                                            }).catch(() => {
                                                toast.error('Failed to copy');
                                            });
                                        }}
                                        className="ml-1 p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        aria-label="Copy invite code"
                                    >
                                        <Copy size={12} />
                                    </button>
                                )}
                            </div>
                            {typeof currentGroup?.storageLimit === 'number' && currentGroup.storageLimit > 0 && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    {(() => {
                                        const usedMb = currentGroup.storageUsage / 1024 / 1024;
                                        const limitMb = currentGroup.storageLimit / 1024 / 1024;
                                        const percent = Math.min(100, (currentGroup.storageUsage / currentGroup.storageLimit) * 100);
                                        return (
                                            <span className="text-xs text-gray-600">
                                                {percent.toFixed(0)}% used ({usedMb.toFixed(1)} MB of {limitMb.toFixed(1)} MB)
                                            </span>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentGroup?.currentUserRole === 'ADMIN' && (
                            <button
                                onClick={() => handleOpenCreateModal(null)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-xs shadow-sm"
                            >
                                + New Section
                            </button>
                        )}
                        {renderViewToggle()}
                    </div>
                </div>

                {currentGroup?.currentUserRole === 'ADMIN' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                            <div>
                                <p className="text-gray-500 tracking-wide">Total sections</p>
                                <p className="text-2xl font-semibold text-gray-900">{sections.length}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-gray-500 tracking-wide">Join requests</p>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                    {pendingLoading ? '…' : pendingRequests.length}
                                </span>
                            </div>
                            {pendingRequests.length === 0 && !pendingLoading ? (
                                <p className="text-xs text-gray-400">No pending requests</p>
                            ) : (
                                <ul className="mt-1 space-y-1 max-h-20 overflow-y-auto text-xs text-gray-700">
                                    {pendingRequests.map(req => (
                                        <li key={req.memberId} className="flex items-center justify-between">
                                            <span className="truncate mr-2">
                                                {req.firstName} {req.lastName}
                                            </span>
                                            <button
                                                onClick={() => handleApproveRequest(req.memberId)}
                                                className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Approve
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Sections</h2>
                    {sectionsLoading ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-sm text-gray-400">
                            Loading sections...
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                            No sections yet. {currentGroup?.currentUserRole === 'ADMIN' && 'Create your first one to get started.'}
                        </div>
                    ) : (
                        <BentoGrid
                            sections={rootSections}
                            previews={sectionPreviews}
                            allSections={sections}
                            groupId={groupId}
                        />
                    )}
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
        </div>
    );
};

export default GroupView;
