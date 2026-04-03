import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import LinksSection from '../components/sections/LinksSection';
import CreateSectionModal from '../components/CreateSectionModal';
import SidebarSection from '../components/SidebarSection';
import BentoGrid from '../components/BentoGrid';
import SettingsModal from '../components/SettingsModal';
import UserInfoModal from '../components/UserInfoModal';
import { useSectionPreviews } from '../hooks/useSectionPreviews';
import { toast } from 'react-toastify';
import { Copy, Trash2, LayoutPanelLeft, LayoutGrid, Users, ArrowLeft, Check, ChevronRight, Pencil, X, ArrowUpDown, Settings, RefreshCw, Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReorderSectionsModal from '../components/ReorderSectionsModal';

const GroupView = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { currentGroup, loading: groupLoading } = useSelector((state) => state.group);
    const { user } = useAuth();

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
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedMemberForInfo, setSelectedMemberForInfo] = useState(null);

    const [renamingSectionId, setRenamingSectionId] = useState(null);
    const [renameTitle, setRenameTitle] = useState('');

    const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

    const [viewMode, setViewMode] = useState('WORKSPACE'); // WORKSPACE | BENTO

    const [showSections, setShowSections] = useState(true);
    const [showMembers, setShowMembers] = useState(false);
    const [showPendingInvites, setShowPendingInvites] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const dragTimeoutRef = useRef(null);

    const [showReorderModal, setShowReorderModal] = useState(false);
    const [reorderParentId, setReorderParentId] = useState(null); // null = root sections

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);
    const searchDebounceRef = useRef(null);

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
            // Fire-and-forget: mark this group as seen so the activity dot clears on Dashboard
            axiosClient.post(`/groups/${groupId}/mark-seen`).catch(() => { });
        }
    }, [currentGroup, groupId]);

    // Search: debounced fetch
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            try {
                setSearchLoading(true);
                const res = await axiosClient.get('/groups/search', { params: { q: searchQuery.trim() } });
                setSearchResults(res.data || []);
                setSearchOpen(true);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(searchDebounceRef.current);
    }, [searchQuery]);

    // Search: click-outside closes dropdown
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch members when group is ready (needed for workspace view sidebar)
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

            // If sections are still loading, don't touch the URL yet. We'll
            // resolve the section once the list has finished loading.
            if (sectionsLoading) {
                return;
            }

            const found = sections.find(s => s.id === targetId);
            if (found) {
                if (!selectedSection || selectedSection.id !== found.id) {
                    setSelectedSection(found);
                }
                return;
            }

            // If the ID in the URL no longer exists *after* sections are
            // loaded, clear it and reset selection.
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
    }, [sections, sectionsLoading, location.search, selectedSection, navigate]);

    // Open manage modal when navigated from dashboard with ?manage=1
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        if (params.get('manage') === '1' && currentGroup && currentGroup.id === parseInt(groupId)) {
            handleOpenManageModal();
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
        if (!groupId) return;
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

    const normalizeParentId = (parentId) => (parentId == null ? null : parentId);

    const getParentIdFromDroppableId = (droppableId) => {
        if (!droppableId) return null;
        if (droppableId.startsWith('children-')) {
            const idPart = droppableId.substring('children-'.length);
            const parsed = parseInt(idPart, 10);
            return Number.isNaN(parsed) ? null : parsed;
        }
        // Anything else (e.g. root lists in sidebar or bento) is root scope
        return null;
    };

    const handleSectionsDragEnd = async (result) => {
        const { source, destination, draggableId } = result || {};

        // Clear dragging state after a short delay to prevent accidental clicks
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
        }
        dragTimeoutRef.current = setTimeout(() => {
            setIsDragging(false);
        }, 200);

        if (!destination || !source) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sectionId = parseInt(draggableId, 10);
        if (!sectionId || Number.isNaN(sectionId)) return;

        const sourceParentId = getParentIdFromDroppableId(source.droppableId);
        const destParentId = getParentIdFromDroppableId(destination.droppableId);

        const sameParent = normalizeParentId(sourceParentId) === normalizeParentId(destParentId);
        if (!sameParent) {
            // For now, only support reordering within the same parent (root or folder).
            // Cross-parent drags (e.g. moving between folders or root <-> folder) simply do nothing.
            toast.info('Items can only be reordered within their current section');
            return;
        }

        // Build sibling lists from current state
        const currentSections = sections;
        const getSiblings = (parentId) =>
            currentSections.filter((s) => normalizeParentId(s.parentId) === normalizeParentId(parentId));

        {
            const siblings = getSiblings(sourceParentId);
            if (!siblings.length) return;

            const reordered = Array.from(siblings);
            const [moved] = reordered.splice(source.index, 1);
            if (!moved) return;
            reordered.splice(destination.index, 0, moved);

            const others = currentSections.filter(
                (s) => normalizeParentId(s.parentId) !== normalizeParentId(sourceParentId)
            );

            setSections([...reordered, ...others]);

            const orderedIds = reordered.map((s) => s.id);
            try {
                await axiosClient.patch('/groups/sections/reorder', orderedIds);
            } catch (error) {
                console.error('Failed to reorder sections', error);
                fetchSections();
            }
        }
    };

    const openRootReorderModal = () => {
        setReorderParentId(null);
        setShowReorderModal(true);
    };

    const openFolderReorderModal = (parentId) => {
        setReorderParentId(parentId);
        setShowReorderModal(true);
    };

    const handleReorderSections = async (orderedIds) => {
        // Reorder root-level sections (for SettingsModal)
        const rootSections = sections.filter((s) => !s.parentId || s.parentId === 'null');
        const reordered = orderedIds
            .map((id) => rootSections.find((s) => s.id === id))
            .filter(Boolean);

        const nonRootSections = sections.filter((s) => s.parentId && s.parentId !== 'null');
        setSections([...reordered, ...nonRootSections]);

        try {
            await axiosClient.patch('/groups/sections/reorder', orderedIds);
        } catch (error) {
            console.error('Failed to reorder sections', error);
            toast.error('Failed to reorder sections');
            fetchSections();
        }
    };

    const handleApplyReorder = async (orderedIds) => {
        const parentId = reorderParentId;
        const normalizedParent = normalizeParentId(parentId);

        const siblings = sections.filter(
            (s) => normalizeParentId(s.parentId) === normalizedParent
        );
        if (!siblings.length) return;

        const reordered = orderedIds
            .map((id) => siblings.find((s) => s.id === id))
            .filter(Boolean);

        const others = sections.filter(
            (s) => normalizeParentId(s.parentId) !== normalizedParent
        );

        setSections([...reordered, ...others]);

        try {
            await axiosClient.patch('/groups/sections/reorder', orderedIds);
        } catch (error) {
            console.error('Failed to reorder sections', error);
            fetchSections();
        }
    };

    const handleDragStart = () => {
        setIsDragging(true);
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

    const handleStartRenameSection = () => {
        if (!selectedSection) return;
        setRenamingSectionId(selectedSection.id);
        setRenameTitle(selectedSection.title || '');
    };

    const handleCancelRenameSection = () => {
        setRenamingSectionId(null);
        setRenameTitle('');
    };

    const handleSubmitRenameSection = async () => {
        if (!selectedSection) return;
        const trimmed = (renameTitle || '').trim();
        if (!trimmed) {
            toast.error('Title cannot be empty');
            return;
        }

        try {
            await axiosClient.patch(`/groups/sections/${selectedSection.id}/title`, { title: trimmed });
            setSections(prev => prev.map(s => (s.id === selectedSection.id ? { ...s, title: trimmed } : s)));
            setSelectedSection(prev => (prev && prev.id === selectedSection.id ? { ...prev, title: trimmed } : prev));
            toast.success('Section renamed');
            setRenamingSectionId(null);
            setRenameTitle('');
        } catch (error) {
            console.error('Failed to rename section', error);
            const msg = error.response?.data?.message || 'Failed to rename section';
            toast.error(msg);
        }
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

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenCreateModal = (parentId = null) => {
        setCreateModalParentId(parentId);
        setShowCreateModal(true);
    };

    const handleOpenManageModal = () => {
        if (!currentGroup) return;
        // Refresh latest data every time the manage modal opens
        fetchSections();
        fetchMembers();
        if (currentGroup.currentUserRole === 'ADMIN') {
            fetchPendingRequests();
        }
        setShowSettingsModal(true);
    };

    const handleApproveRequest = async (memberId) => {
        try {
            await axiosClient.patch(`/groups/members/${memberId}/approve`);
            setPendingRequests(prev => prev.filter(r => r.memberId !== memberId));
            // Refresh members so the approved user appears immediately in lists
            await fetchMembers();
            toast.success('Member approved successfully.');
        } catch (error) {
            console.error('Failed to approve member', error);
            toast.error('Failed to approve member.');
        }
    };

    const handleRejectRequest = async (userId) => {
        try {
            await axiosClient.delete(`/groups/${groupId}/members/${userId}`);
            setPendingRequests(prev => prev.filter(r => r.userId !== userId));
            toast.success('Request rejected.');
        } catch (error) {
            console.error('Failed to reject member', error);
            toast.error('Failed to reject member.');
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

    const handleLeaveGroup = () => {
        if (!currentGroup) return;
        const selfMember = members.find((m) => {
            if (!user) return false;
            if (user.email && m.email) {
                return m.email.toLowerCase() === user.email.toLowerCase();
            }
            if (user.id && m.userId) {
                return m.userId === user.id;
            }
            return false;
        });

        if (!selfMember) {
            toast.error('Could not find your membership in this group.');
            return;
        }

        setConfirmConfig({
            title: 'Leave group?',
            message: 'You will be removed from this group and lose access to its sections.',
            confirmLabel: 'Leave group',
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/groups/${groupId}/members/${selfMember.userId}`);
                    toast.success('You left the group');
                    navigate('/dashboard');
                } catch (error) {
                    console.error('Failed to leave group', error);
                    toast.error('Failed to leave group');
                }
            }
        });
    };

    const SECTION_TYPE_ICONS = { NOTE: '📝', LIST: '✅', GALLERY: '🖼️', REMINDER: '🔔', PAYMENT: '💰', CALENDAR: '📅', LINKS: '🔗', FOLDER: '📁' };
    const SECTION_TYPE_LABELS = { NOTE: 'Note', LIST: 'Checklist', GALLERY: 'Files', REMINDER: 'Reminder', PAYMENT: 'Expenses', CALENDAR: 'Calendar', LINKS: 'Links', FOLDER: 'Folder' };
    const SECTION_TYPE_COLORS = {
        NOTE: { border: 'border-l-blue-400', badge: 'bg-blue-50 text-blue-700' },
        LIST: { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
        REMINDER: { border: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700' },
        CALENDAR: { border: 'border-l-indigo-400', badge: 'bg-indigo-50 text-indigo-700' },
        GALLERY: { border: 'border-l-rose-400', badge: 'bg-rose-50 text-rose-700' },
        PAYMENT: { border: 'border-l-purple-400', badge: 'bg-purple-50 text-purple-700' },
        LINKS: { border: 'border-l-sky-400', badge: 'bg-sky-50 text-sky-700' },
        FOLDER: { border: 'border-l-gray-400', badge: 'bg-gray-50 text-gray-600' },
    };

    const handleSearchResultClick = (result) => {
        setSearchOpen(false);
        setSearchQuery('');
        if (isMobile) {
            // On mobile the workspace sidebar is not usable; SectionView is the right destination
            navigate(`/groups/${groupId}/sections/${result.sectionId}`);
        } else {
            // Force WORKSPACE view so the section is actually rendered.
            // Without &view=WORKSPACE, the viewMode useEffect may re-apply the
            // group's stored preference (e.g. BENTO), leaving the section unrendered.
            navigate(`/groups/${groupId}?section=${result.sectionId}&view=WORKSPACE`);
        }
    };

    const renderSearchBox = (rightAlign = false) => {
        const sectionResults = searchResults.filter(r => r.matchType === 'SECTION');
        const itemResults = searchResults.filter(r => r.matchType === 'ITEM');
        const dropdownPos = rightAlign ? 'right-0' : 'left-0';
        return (
            <div ref={searchRef} className="relative">
                <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border bg-white shadow-sm transition ${searchQuery ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                        onKeyDown={e => e.key === 'Escape' && (setSearchOpen(false), setSearchQuery(''))}
                        placeholder="Search sections & items…"
                        className="w-40 sm:w-52 text-xs bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                    {searchLoading && <div className="w-3 h-3 rounded-full border border-blue-400 border-t-transparent animate-spin flex-shrink-0" />}
                    {searchQuery && !searchLoading && (
                        <button type="button" onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-gray-400 hover:text-gray-600">
                            <X size={12} />
                        </button>
                    )}
                </div>
                {searchOpen && searchResults.length > 0 && (
                    <div className={`absolute top-full ${dropdownPos} mt-1 w-72 max-w-[calc(100vw-1rem)] bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden pb-1`}>
                        {sectionResults.length > 0 && (
                            <>
                                <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-700 bg-gray-50 uppercase tracking-wide">Sections</div>
                                {sectionResults.map((r, i) => {
                                    const colors = SECTION_TYPE_COLORS[r.sectionType] || SECTION_TYPE_COLORS.FOLDER;
                                    return (
                                        <button key={`s-${i}`} type="button" onClick={() => handleSearchResultClick(r)}
                                            className={`w-full flex items-center justify-between gap-2 pl-0 pr-3 py-2 hover:bg-gray-50 text-left border-b-2 border-b-gray-100 border-l-4 ${colors.border}`}>
                                            <span className="pl-3 text-sm text-gray-800 truncate flex-1">{r.sectionTitle}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${colors.badge}`}>{SECTION_TYPE_LABELS[r.sectionType] || r.sectionType}</span>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                        {itemResults.length > 0 && (
                            <>
                                <div className={`px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-700 bg-gray-50 uppercase tracking-wide ${sectionResults.length > 0 ? 'border-t border-gray-100' : ''}`}>Items</div>
                                {itemResults.map((r, i) => {
                                    const colors = SECTION_TYPE_COLORS[r.sectionType] || SECTION_TYPE_COLORS.FOLDER;
                                    return (
                                        <button key={`i-${i}`} type="button" onClick={() => handleSearchResultClick(r)}
                                            className={`w-full flex items-center justify-between gap-2 pl-0 pr-3 py-2 hover:bg-gray-50 text-left border-b-2 border-b-gray-100 border-l-4 ${colors.border}`}>
                                            <div className="pl-3 min-w-0 flex-1">
                                                <p className="text-xs text-gray-800 truncate">{r.itemText}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{r.sectionTitle}</p>
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${colors.badge}`}>{SECTION_TYPE_LABELS[r.sectionType] || r.sectionType}</span>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}
                {searchOpen && searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className={`absolute top-full ${dropdownPos} mt-1 w-64 max-w-[calc(100vw-1rem)] bg-white rounded-md shadow-lg border border-gray-200 z-50 px-4 py-3 text-sm text-gray-400`}>
                        No results for "{searchQuery}"
                    </div>
                )}
            </div>
        );
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
            case 'LIST': return <ListView sectionId={selectedSection.id} section={selectedSection} />;
            case 'GALLERY': return <GalleryView sectionId={selectedSection.id} />;
            case 'REMINDER': return <ReminderView sectionId={selectedSection.id} />;
            case 'PAYMENT': return <PaymentView sectionId={selectedSection.id} />;
            case 'CALENDAR': return <CalendarView sectionId={selectedSection.id} />;
            case 'FOLDER': return (
                <FolderView
                    sectionId={selectedSection.id}
                    allSections={sections}
                    onSelectSection={handleSelectSection}
                    onOpenCreateModal={currentGroup?.currentUserRole === 'ADMIN' ? handleOpenCreateModal : undefined}
                />
            );
            case 'LINKS': return <LinksSection sectionId={selectedSection.id} />;
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
            <>
                <div className="hidden sm:inline-flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchSections}
                        disabled={sectionsLoading}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-medium shadow-sm transition disabled:opacity-50"
                        title="Refresh sections"
                    >
                        <RefreshCw size={14} className={sectionsLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm">
                        <button
                            type="button"
                            onClick={handleWorkspaceClick}
                            className={`inline-flex items-center gap-1 px-3.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-medium transition ${viewMode === 'WORKSPACE'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <LayoutPanelLeft size={14} />
                            Workspace
                        </button>
                        <button
                            type="button"
                            onClick={handleOverviewClick}
                            className={`inline-flex items-center gap-1 px-3.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-medium transition ${viewMode === 'BENTO'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <LayoutGrid size={14} />
                            Overview
                        </button>
                    </div>
                </div>
                {/* Mobile-only refresh button */}
                <button
                    type="button"
                    onClick={fetchSections}
                    disabled={sectionsLoading}
                    className="sm:hidden inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-medium shadow-sm transition disabled:opacity-50"
                    title="Refresh sections"
                >
                    <RefreshCw size={14} className={sectionsLoading ? 'animate-spin' : ''} />
                    <span className="">Refresh</span>
                </button>
            </>
        );
    };

    // WORKSPACE VIEW: sidebar + focused section workspace
    if (viewMode === 'WORKSPACE') {
        return (
            <DragDropContext onDragEnd={handleSectionsDragEnd} onDragStart={handleDragStart}>
                <div className="flex h-[calc(100vh-7rem)] bg-gray-50 overflow-hidden shadow-sm rounded">
                    {/* Sidebar */}
                    <aside className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('currentGroupId');
                                            navigate('/dashboard');
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                    >
                                        <ArrowLeft size={13} />
                                        <span>Back to groups</span>
                                    </button>
                                    {currentGroup && (
                                        <button
                                            type="button"
                                            onClick={handleOpenManageModal}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                        >
                                            <Settings size={14} />
                                            Settings
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
                                            navigator.clipboard.writeText(currentGroup.inviteCode || '').then(() => {
                                                setInviteCodeCopied(true);
                                                toast.success('Invite code copied');
                                                setTimeout(() => setInviteCodeCopied(false), 1500);
                                            }).catch(() => {
                                                toast.error('Failed to copy');
                                            });
                                        }}
                                        className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        aria-label="Copy invite code"
                                    >
                                        {inviteCodeCopied ? <Check size={12} /> : <Copy size={12} />}
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

                        {/* Search sits outside the scrollable area so its dropdown is never clipped */}
                        <div className="px-3 py-2 border-b">
                            {renderSearchBox(false)}
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <button
                                type="button"
                                onClick={() => setShowSections(prev => !prev)}
                                className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50 rounded-md"
                            >
                                <span>Sections</span>
                                <ChevronRight
                                    size={12}
                                    className={`text-gray-400 transition-transform ${showSections ? 'rotate-90' : ''}`}
                                />
                            </button>
                            {showSections && (
                                <Droppable droppableId="root-sidebar">
                                    {(provided) => (
                                        <nav
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="mt-1 space-y-2"
                                        >
                                            {sectionsLoading ? (
                                                <div className="text-center text-gray-400 text-sm py-4">Loading sections...</div>
                                            ) : (
                                                rootSections.map((section, index) => (
                                                    <Draggable
                                                        key={section.id}
                                                        draggableId={String(section.id)}
                                                        index={index}
                                                    >
                                                        {(dragProvided, dragSnapshot) => (
                                                            <SidebarSection
                                                                section={section}
                                                                allSections={sections}
                                                                selectedSection={selectedSection}
                                                                onSelect={handleSelectSection}
                                                                dragHandleProps={dragProvided.dragHandleProps}
                                                                draggableProps={dragProvided.draggableProps}
                                                                innerRef={dragProvided.innerRef}
                                                                isDragging={isDragging}
                                                                snapshot={dragSnapshot}
                                                            />
                                                        )}
                                                    </Draggable>
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </nav>
                                    )}
                                </Droppable>
                            )}
                            {showSections && !sectionsLoading && rootSections.length > 0 && (
                                <p className="mt-1 text-[10px] text-gray-400">
                                    Tip: drag sections to change their order.
                                </p>
                            )}
                        </div>

                        <div className="p-4 border-t space-y-3">
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMembers(prev => !prev)}
                                    className="flex w-full items-center justify-between text-xs text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-50"
                                >
                                    <span className="flex items-center gap-1 font-semibold">
                                        <Users size={12} className="text-gray-500" />
                                        <span>Members</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                            {membersLoading ? '…' : members.length}
                                        </span>
                                        <ChevronRight
                                            size={12}
                                            className={`text-gray-400 transition-transform ${showMembers ? 'rotate-90' : ''}`}
                                        />
                                    </span>
                                </button>

                                {showMembers && (
                                    <ul className="mt-2 space-y-1 max-h-none md:max-h-72 overflow-y-auto text-[11px] text-gray-700">
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
                                                        {member.pfpUrl ? (
                                                            <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                                                                <img
                                                                    src={member.pfpUrl}
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
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {currentGroup?.currentUserRole !== 'ADMIN' && member.role == 'ADMIN' && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                                {member.role}
                                                            </span>
                                                        )}
                                                        {currentGroup?.currentUserRole === 'ADMIN' && member.role !== 'ADMIN' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMember(member)}
                                                                className="p-1 text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                )}
                            </div>

                            {currentGroup?.currentUserRole === 'ADMIN' && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPendingInvites(prev => !prev)}
                                        className="flex w-full items-center justify-between text-xs text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-50"
                                    >
                                        <span className="flex items-center gap-1 font-semibold">
                                            <span>Pending invites</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                                                {pendingLoading ? '…' : pendingRequests.length}
                                            </span>
                                            <ChevronRight
                                                size={12}
                                                className={`text-gray-400 transition-transform ${showPendingInvites ? 'rotate-90' : ''}`}
                                            />
                                        </span>
                                    </button>

                                    {showPendingInvites && (
                                        <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto text-[11px] text-gray-700">
                                            {pendingRequests.length === 0 && !pendingLoading ? (
                                                <li className="text-gray-400 px-2 py-1.5 text-[11px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                                                    No pending invites.
                                                </li>
                                            ) : (
                                                pendingRequests.map(req => (
                                                    <li
                                                        key={req.memberId}
                                                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-gray-50"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">
                                                                {req.firstName} {req.lastName}
                                                            </p>
                                                            {req.email && (
                                                                <p className="text-[10px] text-gray-500 truncate">{req.email}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveRequest(req.memberId)}
                                                            className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700 flex-shrink-0"
                                                        >
                                                            Approve
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main workspace */}
                    <main className="flex-1 flex flex-col bg-gray-50">
                        <div className="border-b bg-white px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                {selectedSection ? (
                                    <>
                                        <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">Current section</p>
                                        {renamingSectionId === selectedSection.id ? (
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="w-40 sm:w-64 lg:w-80 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                    value={renameTitle}
                                                    onChange={(e) => setRenameTitle(e.target.value)}
                                                    maxLength={120}
                                                    autoFocus
                                                />
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
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                                    {selectedSection.title}
                                                </h2>
                                                {currentGroup?.currentUserRole === 'ADMIN' && (
                                                    <button
                                                        type="button"
                                                        onClick={handleStartRenameSection}
                                                        className="inline-flex items-center justify-center p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                                                        aria-label="Rename section"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-sm sm:text-base font-semibold text-gray-900">Workspace</h2>
                                        <p className="text-[11px] text-gray-500">Select a section from the sidebar to start.</p>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedSection && currentGroup?.currentUserRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteSection}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete section</span>
                                    </button>
                                )}
                                {selectedSection && selectedSection.type === 'FOLDER' && currentGroup?.currentUserRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        onClick={() => openFolderReorderModal(selectedSection.id)}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        <ArrowUpDown size={14} />
                                        <span>Reorder items</span>
                                    </button>
                                )}
                                {renderViewToggle()}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-3 sm:py-4">
                            {renderSectionContent()}
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
                    {showSettingsModal && currentGroup && (
                        <SettingsModal
                            group={currentGroup}
                            sections={sections}
                            members={members}
                            onClose={() => setShowSettingsModal(false)}
                            onUpdateGroupName={handleUpdateGroupName}
                            onDeleteGroup={() => {
                                setShowSettingsModal(false);
                                handleDeleteGroup();
                            }}
                            onAddSection={() => {
                                setShowSettingsModal(false);
                                handleOpenCreateModal(null);
                            }}
                            onRemoveMember={(member) => {
                                setShowSettingsModal(false);
                                handleRemoveMember(member);
                            }}
                            onDeleteSection={(section) => {
                                setShowSettingsModal(false);
                                handleDeleteSectionById(section);
                            }}
                            onViewMember={(member) => setSelectedMemberForInfo(member)}
                            onLeaveGroup={currentGroup.currentUserRole !== 'ADMIN' ? () => {
                                setShowSettingsModal(false);
                                handleLeaveGroup();
                            } : undefined}
                            joinRequests={pendingRequests}
                            onApproveJoinRequest={handleApproveRequest}
                            onRejectJoinRequest={handleRejectRequest}
                            onInviteByEmail={currentGroup.currentUserRole === 'ADMIN' ? async (email) => {
                                try {
                                    await axiosClient.post(`/groups/${groupId}/invites`, { email });
                                    toast.success('Invite sent');
                                } catch (error) {
                                    console.error('Failed to send invite', error);
                                    const msg = error.response?.data?.message || 'Failed to send invite';
                                    toast.error(msg);
                                }
                            } : undefined}
                            onReorderSections={handleReorderSections}
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
                    {showReorderModal && (
                        <ReorderSectionsModal
                            open={showReorderModal}
                            title={reorderParentId == null ? 'Reorder sections' : 'Reorder items in folder'}
                            items={sections.filter((s) => normalizeParentId(s.parentId) === normalizeParentId(reorderParentId))}
                            onClose={() => setShowReorderModal(false)}
                            onSave={handleApplyReorder}
                        />
                    )}
                </div>
            </DragDropContext>
        );
    }

    // BENTO / OVERVIEW VIEW: grid of sections with quick info
    return (
        <div className="min-h-[50dvh] bg-neutral-50 px-2 sm:px-4 flex flex-col">
            <div className="max-w-7xl mx-auto space-y-6 flex-1 w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('currentGroupId');
                                navigate('/dashboard');
                            }}
                            className="mb-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                        >
                            <ArrowLeft size={13} />
                            <span>Back to groups</span>
                        </button>
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 truncate max-w-full">
                                    {currentGroup?.displayName}
                                </h1>
                                {currentGroup?.inviteCode && (
                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                        <span className="hidden sm:inline">Code:</span>
                                        <span className="font-mono text-[11px] uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                                            {currentGroup.inviteCode}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentGroup.inviteCode || '').then(() => {
                                                    setInviteCodeCopied(true);
                                                    toast.success('Invite code copied');
                                                    setTimeout(() => setInviteCodeCopied(false), 1500);
                                                }).catch(() => {
                                                    toast.error('Failed to copy');
                                                });
                                            }}
                                            className="ml-0.5 p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                            aria-label="Copy invite code"
                                        >
                                            {inviteCodeCopied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {typeof currentGroup?.storageLimit === 'number' && currentGroup.storageLimit > 0 && (
                                <div className="text-[11px] text-gray-500">
                                    {(() => {
                                        const usedMb = currentGroup.storageUsage / 1024 / 1024;
                                        const limitMb = currentGroup.storageLimit / 1024 / 1024;
                                        const percent = Math.min(100, (currentGroup.storageUsage / currentGroup.storageLimit) * 100);
                                        return `${percent.toFixed(0)}% used (${usedMb.toFixed(1)} MB of ${limitMb.toFixed(1)} MB)`;
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {currentGroup?.currentUserRole === 'ADMIN' && (
                            <button
                                onClick={() => handleOpenCreateModal(null)}
                                className="px-3 py-2 rounded-full border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-medium text-xs"
                            >
                                + New Section
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={openRootReorderModal}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-medium shadow-sm transition"
                            title="Reorder sections"
                        >
                            <ArrowUpDown size={14} />
                            <span className="inline">Reorder</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenManageModal}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-medium shadow-sm transition"
                            title="Group Settings"
                        >
                            <Settings size={14} />
                            <span className="inline">Settings</span>
                        </button>
                        {renderViewToggle()}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h2 className="text-sm font-semibold text-gray-700 shrink-0">Sections</h2>
                        <div className="flex items-center gap-1">
                            {renderSearchBox(true)}
                        </div>
                    </div>
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

                {/* Admin summary cards have been removed to keep the main group view clean.
                    Use the "Manage group" button to see admin-focused stats instead. */}
            </div>

            {showCreateModal && (
                <CreateSectionModal
                    groupId={groupId}
                    parentId={createModalParentId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleSectionCreated}
                />
            )}
            {showSettingsModal && currentGroup && (
                <SettingsModal
                    group={currentGroup}
                    sections={sections}
                    members={members}
                    onClose={() => setShowSettingsModal(false)}
                    onUpdateGroupName={handleUpdateGroupName}
                    onDeleteGroup={() => {
                        setShowSettingsModal(false);
                        handleDeleteGroup();
                    }}
                    onAddSection={() => {
                        setShowSettingsModal(false);
                        handleOpenCreateModal(null);
                    }}
                    onRemoveMember={(member) => {
                        setShowSettingsModal(false);
                        handleRemoveMember(member);
                    }}
                    onDeleteSection={(section) => {
                        setShowSettingsModal(false);
                        handleDeleteSectionById(section);
                    }}
                    onViewMember={(member) => setSelectedMemberForInfo(member)}
                    joinRequests={pendingRequests}
                    onApproveJoinRequest={handleApproveRequest}
                    onRejectJoinRequest={handleRejectRequest}
                    onInviteByEmail={currentGroup.currentUserRole === 'ADMIN' ? async (email) => {
                        try {
                            await axiosClient.post(`/groups/${groupId}/invites`, { email });
                            toast.success('Invite sent');
                        } catch (error) {
                            console.error('Failed to send invite', error);
                            const msg = error.response?.data?.message || 'Failed to send invite';
                            toast.error(msg);
                        }
                    } : undefined}
                    onReorderSections={handleReorderSections}
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
            {showReorderModal && (
                <ReorderSectionsModal
                    open={showReorderModal}
                    title={reorderParentId == null ? 'Reorder sections' : 'Reorder items in folder'}
                    items={sections.filter((s) => normalizeParentId(s.parentId) === normalizeParentId(reorderParentId))}
                    onClose={() => setShowReorderModal(false)}
                    onSave={handleApplyReorder}
                />
            )}
        </div>
    );
};

export default GroupView;
