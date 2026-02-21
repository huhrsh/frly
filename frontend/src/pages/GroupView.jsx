import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import BentoGrid from '../components/BentoGrid';
import GroupManageModal from '../components/GroupManageModal';
import UserInfoModal from '../components/UserInfoModal';
import { useSectionPreviews } from '../hooks/useSectionPreviews';
import { toast } from 'react-toastify';
import { Copy, Trash2, LayoutPanelLeft, LayoutGrid, Users, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const GroupView = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { currentGroup, loading: groupLoading } = useSelector((state) => state.group);

    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createModalParentId, setCreateModalParentId] = useState(null);

    // Section-level passwords have been removed; keep placeholder state for potential future use
    const [unlockedSections, setUnlockedSections] = useState({});

    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const [confirmConfig, setConfirmConfig] = useState(null);
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedMemberForInfo, setSelectedMemberForInfo] = useState(null);

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

        const params = new URLSearchParams(location.search || '');
        const forcedView = params.get('view');

        if (forcedView === 'WORKSPACE' || forcedView === 'BENTO') {
            setViewMode(forcedView);
            return;
        }

        if (isMobile) {
            setViewMode('BENTO');
        } else if (currentGroup.viewPreference) {
            setViewMode(currentGroup.viewPreference);
        }
    }, [currentGroup, isMobile, location.search]);

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

    useEffect(() => {
        const id = parseInt(groupId);
        if (currentGroup && currentGroup.id === id) {
            fetchMembers();
        }
    }, [currentGroup, groupId]);

    // Keep selected section in sync with the URL (?section=ID).
    // When no section is specified, leave the workspace empty by default.
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        const sectionIdParam = params.get('section');

        if (sectionIdParam) {
            const targetId = parseInt(sectionIdParam, 10);
            const found = sections.find(s => s.id === targetId);
            if (found) {
                if (!selectedSection || selectedSection.id !== found.id) {
                    setSelectedSection(found);
                }
                return;
            }

            // If the ID in the URL no longer exists, clear it and reset selection.
            params.delete('section');
            navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
            if (selectedSection) {
                setSelectedSection(null);
            }
            return;
        }

        // No ?section in URL: keep whatever is already selected, but if the
        // selected section was removed from the list, clear it.
        if (selectedSection && !sections.find(s => s.id === selectedSection.id)) {
            setSelectedSection(null);
        }
    }, [sections, location.search, selectedSection, navigate]);

    // Open manage modal when navigated from dashboard with ?manage=1
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        if (params.get('manage') === '1' && currentGroup && currentGroup.id === parseInt(groupId)) {
            setShowManageModal(true);
        }
    }, [location.search, currentGroup, groupId]);

    // Load lightweight previews for bento view (notes, lists, reminders) when needed
    // Logic moved to useSectionPreviews hook

    const fetchSections = async () => {
        setSectionsLoading(true);
        try {
            const response = await axiosClient.get('/groups/sections');
            setSections(Array.isArray(response.data) ? response.data : []);
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

    const fetchMembers = async () => {
        setMembersLoading(true);
        try {
            const response = await axiosClient.get(`/groups/${groupId}/members`);
            setMembers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch members', error);
            toast.error('Failed to load members.');
        } finally {
            setMembersLoading(false);
        }
    };

    const handleDeleteSection = () => {
        if (!selectedSection) return;
        setConfirmConfig({
            title: 'Delete section?',
            message: `Delete section "${selectedSection.title}" and its contents?`,
            confirmLabel: 'Delete section',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/sections/${selectedSection.id}`);
                    setSections(prev => prev.filter(s => s.id !== selectedSection.id));
                    handleSelectSection(null);
                    toast.success('Section deleted');
                } catch (error) {
                    console.error('Failed to delete section', error);
                    toast.error('Failed to delete section');
                }
            }
        });
    };

    const handleDeleteSectionById = (section) => {
        if (!section) return;
        setConfirmConfig({
            title: 'Delete section?',
            message: `Delete section "${section.title}" and its contents?`,
            confirmLabel: 'Delete section',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/sections/${section.id}`);
                    setSections(prev => prev.filter(s => s.id !== section.id));
                    if (selectedSection && selectedSection.id === section.id) {
                        handleSelectSection(null);
                    }
                    toast.success('Section deleted');
                } catch (error) {
                    console.error('Failed to delete section', error);
                    toast.error('Failed to delete section');
                }
            }
        });
    };

    const handleDeleteGroup = () => {
        if (!currentGroup) return;
        if (currentGroup.currentUserRole !== 'ADMIN') {
            toast.error('Only admins can delete the group');
            return;
        }
        setConfirmConfig({
            title: 'Delete group?',
            message: `Delete group "${currentGroup.displayName}"? This cannot be undone.`,
            confirmLabel: 'Delete group',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/${currentGroup.id}`);
                    toast.success('Group deleted');
                    navigate('/dashboard');
                } catch (error) {
                    console.error('Failed to delete group', error);
                    toast.error('Failed to delete group');
                }
            }
        });
    };

    const handleSectionCreated = () => {
        setShowCreateModal(false);
        setCreateModalParentId(null);
        fetchSections();
        toast.success("Section created successfully!");
    };

    const handleUpdateGroupName = async (newName) => {
        if (!currentGroup || !newName || newName === currentGroup.displayName) return;
        try {
            await axiosClient.patch(`/groups/${currentGroup.id}`, { displayName: newName });
            toast.success('Group updated');
            dispatch(fetchGroupDetails(groupId));
        } catch (error) {
            console.error('Failed to update group', error);
            toast.error('Failed to update group');
        }
    };

    const handleChangeViewMode = async (mode) => {
        if (isMobile) return; // On mobile we always stay in BENTO
        if (!currentGroup || mode === viewMode) return;

        // Update local state
        setViewMode(mode);

        // Keep URL in sync so refresh stays on the correct view
        const params = new URLSearchParams(location.search || '');
        if (mode === 'BENTO' || mode === 'WORKSPACE') {
            params.set('view', mode);
        } else {
            params.delete('view');
        }
        navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });

        try {
            await axiosClient.patch(`/groups/${currentGroup.id}/view-preference`, { viewPreference: mode });
            // Refresh group details so currentGroup.viewPreference stays in sync
            // for other views (like SectionView) that rely on it.
            dispatch(fetchGroupDetails(groupId));
        } catch (error) {
            console.error('Failed to update view preference', error);
        }
    };

    const handleSelectSection = (section) => {
        setSelectedSection(section || null);

        const params = new URLSearchParams(location.search || '');
        if (section && section.id) {
            params.set('section', section.id);
        } else {
            params.delete('section');
        }

        navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: false });
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

    const handleRemoveMember = (member) => {
        if (!currentGroup || currentGroup.currentUserRole !== 'ADMIN') {
            toast.error('Only admins can remove members');
            return;
        }
        if (member.role === 'ADMIN') {
            toast.error('Admins cannot be removed');
            return;
        }

        setConfirmConfig({
            title: 'Remove member?',
            message: `Remove ${member.firstName || ''} ${member.lastName || ''} from this group?`,
            confirmLabel: 'Remove',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/${groupId}/members/${member.userId}`);
                    setMembers(prev => prev.filter(m => m.userId !== member.userId));
                    toast.success('Member removed');
                } catch (error) {
                    console.error('Failed to remove member', error);
                    toast.error('Failed to remove member');
                }
            }
        });
    };

    const renderSectionContent = () => {
        if (!selectedSection) {
            const hasSections = sections && sections.length > 0;
            const isAdmin = currentGroup?.currentUserRole === 'ADMIN';

            return (
                <div className="h-full flex items-center justify-center px-4 py-8">
                    <div className="text-center text-sm text-gray-500 max-w-sm">
                        <p className="font-medium text-gray-800">
                            {hasSections ? 'No section selected' : 'No sections in this group yet'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            {hasSections
                                ? 'Choose a section from the sidebar to start working in this group.'
                                : isAdmin
                                    ? 'Create your first section from the sidebar to start using this workspace.'
                                    : 'Ask an admin to create sections for this group.'}
                        </p>
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
                    onSelectSection={handleSelectSection}
                    onOpenCreateModal={handleOpenCreateModal}
                />
            );
            default: return <div className="p-4">Unknown Type</div>;
        }
    };

    if (groupLoading) return <div className="p-10 flex justify-center">Loading Group...</div>;



    const renderViewToggle = () => {
        const handleWorkspaceClick = () => {
            handleChangeViewMode('WORKSPACE');
        };

        const handleOverviewClick = async () => {
            // When moving from workspace to overview, treat it as changing
            // the group's view preference to BENTO so "back to groups"
            // takes you to the overview grid instead of workspace.
            if (viewMode === 'WORKSPACE') {
                await handleChangeViewMode('BENTO');
            }

            if (selectedSection) {
                navigate(`/groups/${groupId}/sections/${selectedSection.id}?from=WORKSPACE`);
                return;
            }

            handleChangeViewMode('BENTO');
        };

        return (
            <div className="hidden sm:inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-[11px] shadow-sm">
                <button
                    type="button"
                    onClick={handleWorkspaceClick}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition ${viewMode === 'WORKSPACE'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <LayoutPanelLeft size={12} />
                    Workspace
                </button>
                <button
                    type="button"
                    onClick={handleOverviewClick}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition ${viewMode === 'BENTO'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <LayoutGrid size={12} />
                    Overview
                </button>
            </div>
        );
    };

    // WORKSPACE VIEW: sidebar + focused section workspace
    if (viewMode === 'WORKSPACE') {
        return (
            <div className="flex h-[calc(100vh-7rem)] bg-gray-50 overflow-hidden shadow-sm rounded">
                {/* Sidebar */}
                <aside className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                >
                                    <ArrowLeft size={12} />
                                    <span>Back to groups</span>
                                </button>
                                {currentGroup?.currentUserRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowManageModal(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                    >
                                        Manage
                                    </button>
                                )}
                            </div>
                        </div>
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
                            <>
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                        style={{ width: `${Math.min(100, (currentGroup.storageUsage / currentGroup.storageLimit) * 100)}%` }}
                                    ></div>
                                </div>
                                {(() => {
                                    const usedMb = currentGroup.storageUsage / 1024 / 1024;
                                    const limitMb = currentGroup.storageLimit / 1024 / 1024;
                                    const percent = Math.min(100, (currentGroup.storageUsage / currentGroup.storageLimit) * 100);
                                    return (
                                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                                            <span>{percent.toFixed(0)}% used</span>
                                            <span>
                                                {usedMb.toFixed(1)} MB of {limitMb.toFixed(1)} MB
                                            </span>
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {currentGroup?.currentUserRole === 'ADMIN' && (
                            <button
                                type="button"
                                onClick={() => handleOpenCreateModal(null)}
                                className="mt-3 w-full flex items-center justify-center px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-medium hover:bg-blue-50 focus:outline-none"
                            >
                                + New Section
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="px-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Sections</div>
                        <nav className="space-y-2">
                            {sectionsLoading ? (
                                <div className="text-center text-gray-400 text-sm py-4">Loading sections...</div>
                            ) : (
                                rootSections.map(section => (
                                    <SidebarSection
                                        key={section.id}
                                        section={section}
                                        allSections={sections}
                                        selectedSection={selectedSection}
                                        onSelect={handleSelectSection}
                                    />
                                ))
                            )}
                        </nav>
                    </div>

                    <div className="p-4 border-t space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <div className="flex items-center gap-1 font-semibold">
                                <Users size={12} className="text-gray-500" />
                                <span>Members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                    {membersLoading ? '…' : members.length}
                                </span>
                                {/* Removed Manage button for simplicity */}
                            </div>
                        </div>
                        <ul className="space-y-1 max-h-60 md:max-h-72 overflow-y-auto text-[11px] text-gray-700">
                            {members.length === 0 && !membersLoading ? (
                                <li className="text-gray-400">No members loaded.</li>
                            ) : (
                                members.map(member => (
                                    <li
                                        key={member.userId}
                                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-gray-50"
                                        title={`${member.firstName || ''} ${member.lastName || ''} \n${member.email || ''}`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {member.pfpUrl || member.avatarUrl ? (
                                                <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                                                    <img
                                                        src={member.pfpUrl || member.avatarUrl}
                                                        alt={member.firstName || member.email}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-semibold text-blue-600 border border-blue-100 shrink-0">
                                                    {((member.firstName?.[0] || '') + (member.lastName?.[0] || '') || (member.email?.[0] || '?')).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <button
                                                    type="button"
                                                    className="truncate font-medium text-left hover:underline"
                                                    onClick={() => setSelectedMemberForInfo(member)}
                                                >
                                                    {member.firstName} {member.lastName}
                                                </button>
                                                {member.email && (
                                                    <p className="text-[10px] text-gray-500 truncate">{member.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        {currentGroup?.currentUserRole === 'ADMIN' && member.role !== 'ADMIN' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(member)}
                                                className="text-[10px] text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>

                        {currentGroup?.currentUserRole === 'ADMIN' && (
                            <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
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
                        {/* Link to dashboard or something could go here */}
                        {selectedSection && selectedSection.parentId && (
                            <button
                                onClick={() => {
                                    // Find parent
                                    const parent = sections.find(s => s.id === selectedSection.parentId);
                                    if (parent) handleSelectSection(parent);
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
                                                        : selectedSection.type === 'PAYMENT' ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}>
                                            {selectedSection.type === 'NOTE' ? 'Notes'
                                                : selectedSection.type === 'LIST' ? 'Lists'
                                                    : selectedSection.type === 'GALLERY' ? 'Files'
                                                        : selectedSection.type === 'REMINDER' ? 'Reminders'
                                                            : selectedSection.type === 'PAYMENT' ? 'Expenses'
                                                                : 'Folder'}
                                        </span>
                                    </div>
                                    {selectedSection.parentId && (
                                        <button
                                            onClick={() => {
                                                const parent = sections.find(s => s.id === selectedSection.parentId);
                                                if (parent) handleSelectSection(parent);
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
                                    type="button"
                                    onClick={handleDeleteSection}
                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete section</span>
                                </button>
                            )}
                            {renderViewToggle()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                        <div className={`bg-white rounded-xl shadow-sm border overflow-auto ${selectedSection
                            ? selectedSection.type === 'NOTE' ? 'border-blue-100'
                                : selectedSection.type === 'LIST' ? 'border-emerald-100'
                                    : selectedSection.type === 'GALLERY' ? 'border-rose-100'
                                        : selectedSection.type === 'REMINDER' ? 'border-amber-100'
                                            : selectedSection.type === 'PAYMENT' ? 'border-indigo-100'
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
                {showManageModal && currentGroup && (
                    <GroupManageModal
                        group={currentGroup}
                        sections={sections}
                        members={members}
                        onClose={() => setShowManageModal(false)}
                        onUpdateGroupName={handleUpdateGroupName}
                        onDeleteGroup={() => {
                            setShowManageModal(false);
                            handleDeleteGroup();
                        }}
                        onAddSection={() => {
                            setShowManageModal(false);
                            handleOpenCreateModal(null);
                        }}
                        onRemoveMember={(member) => {
                            setShowManageModal(false);
                            handleRemoveMember(member);
                        }}
                        onDeleteSection={(section) => {
                            setShowManageModal(false);
                            handleDeleteSectionById(section);
                        }}
                        onViewMember={(member) => setSelectedMemberForInfo(member)}
                    />
                )}
                {selectedMemberForInfo && (
                    <UserInfoModal
                        member={selectedMemberForInfo}
                        onClose={() => setSelectedMemberForInfo(null)}
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
            </div>
        );
    }

    // BENTO / OVERVIEW VIEW: grid of sections with quick info
    return (
        <div className="min-h-screen bg-gray-50 px-2 sm:px-4 py-4 flex flex-col">
            <div className="max-w-7xl mx-auto space-y-6 flex-1 w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="mb-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                        >
                            <ArrowLeft size={12} />
                            <span>Back to groups</span>
                        </button>
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
                            <>
                                <button
                                    onClick={() => handleOpenCreateModal(null)}
                                    className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-medium text-xs"
                                >
                                    + New Section
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowManageModal(true)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Manage group
                                </button>
                            </>
                        )}
                        {renderViewToggle()}
                    </div>
                </div>

                {currentGroup?.currentUserRole === 'ADMIN' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                            <div>
                                <p className="text-gray-500 tracking-wide">Total sections</p>
                                <p className="text-2xl font-semibold text-gray-900">{rootSections.length}</p>
                                <p className="mt-1 text-[11px] text-gray-500">
                                    {rootSections.length === sections.length
                                        ? 'No nested sections'
                                        : `${sections.length} including nested sections`}
                                </p>
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-gray-500 tracking-wide">Members</p>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                    {membersLoading ? '…' : members.length}
                                </span>
                            </div>
                            <ul className="mt-1 space-y-1 max-h-20 overflow-y-auto text-xs text-gray-700">
                                {members.length === 0 && !membersLoading ? (
                                    <li className="text-gray-400">No members yet.</li>
                                ) : (
                                    members.map(member => (
                                        <li
                                            key={member.userId}
                                            className="flex items-center justify-between gap-2"
                                            title={`${member.firstName || ''} ${member.lastName || ''} \n${member.email || ''}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-semibold text-blue-600 border border-blue-100 shrink-0 overflow-hidden">
                                                    {member.pfpUrl ? (
                                                        <img
                                                            src={member.pfpUrl}
                                                            alt={member.firstName || member.email || 'Member avatar'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        ((member.firstName?.[0] || '') + (member.lastName?.[0] || '') || (member.email?.[0] || '?')).toUpperCase()
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="truncate hover:underline text-left"
                                                    onClick={() => setSelectedMemberForInfo(member)}
                                                >
                                                    {member.firstName} {member.lastName}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {member.role === 'ADMIN' && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[9px] uppercase">
                                                        Admin
                                                    </span>
                                                )}
                                                {currentGroup?.currentUserRole === 'ADMIN' && member.role !== 'ADMIN' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(member)}
                                                        className="text-[10px] text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
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
                            onOpenCreateModal={currentGroup?.currentUserRole === 'ADMIN' ? handleOpenCreateModal : undefined}
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
            {showManageModal && currentGroup && (
                <GroupManageModal
                    group={currentGroup}
                    sections={sections}
                    members={members}
                    onClose={() => setShowManageModal(false)}
                    onUpdateGroupName={handleUpdateGroupName}
                    onDeleteGroup={() => {
                        setShowManageModal(false);
                        handleDeleteGroup();
                    }}
                    onAddSection={() => {
                        setShowManageModal(false);
                        handleOpenCreateModal(null);
                    }}
                    onRemoveMember={(member) => {
                        setShowManageModal(false);
                        handleRemoveMember(member);
                    }}
                    onDeleteSection={(section) => {
                        setShowManageModal(false);
                        handleDeleteSectionById(section);
                    }}
                    onViewMember={(member) => setSelectedMemberForInfo(member)}
                />
            )}
            {selectedMemberForInfo && (
                <UserInfoModal
                    member={selectedMemberForInfo}
                    onClose={() => setSelectedMemberForInfo(null)}
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
        </div>
    );
};

export default GroupView;
