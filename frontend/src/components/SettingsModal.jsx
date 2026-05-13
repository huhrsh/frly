import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Bell, Smartphone, Trash2, PlusCircle, GripVertical, History, MoreVertical } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SettingsModal = ({
  group,
  sections,
  members,
  onClose,
  onUpdateGroupName,
  onDeleteGroup,
  onAddSection,
  onRemoveMember,
  onDeleteSection,
  onViewMember,
  onLeaveGroup,
  onInviteByEmail,
  joinRequests,
  onApproveJoinRequest,
  onRejectJoinRequest,
  onReorderSections
}) => {
  const [activeTab, setActiveTab] = useState('manage');
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(true);
  const [processingRequests, setProcessingRequests] = useState({});
  const [notificationPrefs, setNotificationPrefs] = useState({
    sectionPreferences: {
      NOTE: 'IN_APP_ONLY',
      LIST: 'BOTH',
      LINKS: 'IN_APP_ONLY',
      GALLERY: 'IN_APP_ONLY',
      REMINDER: 'BOTH',
      PAYMENT: 'BOTH',
      CALENDAR: 'BOTH',
      FOLDER: 'IN_APP_ONLY'
    }
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [localSections, setLocalSections] = useState([]);
  const [name, setName] = useState(group?.displayName || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [updatingDefaultRole, setUpdatingDefaultRole] = useState(false);
  const [defaultMemberRole, setDefaultMemberRole] = useState(group?.defaultMemberRole || 'MEMBER');
  const [openKebabId, setOpenKebabId] = useState(null);
  const [kebabPos, setKebabPos] = useState(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState(null); // { member, newRole }
  const [defaultRoleConfirm, setDefaultRoleConfirm] = useState(null); // pending new default role string
  const kebabRef = useRef(null);
  
  const navigate = useNavigate();
  const isOwner = group?.currentUserRole === 'OWNER';
  const isAdmin = isOwner || group?.currentUserRole === 'ADMIN';

  useEffect(() => {
    const handler = (e) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) {
        setOpenKebabId(null);
        setKebabPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleActivityEntryClick = (entry) => {
    if (!entry.sectionId) return;
    onClose();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      navigate(`/groups/${group.id}/sections/${entry.sectionId}`);
    } else {
      navigate(`/groups/${group.id}?section=${entry.sectionId}&view=WORKSPACE`);
    }
  };

  const sectionTypes = [
    { key: 'NOTE', label: 'Notes', borderColor: '#60a5fa' },
    { key: 'LIST', label: 'Checklists', borderColor: '#34d399' },
    { key: 'LINKS', label: 'Links', borderColor: '#38bdf8' },
    { key: 'GALLERY', label: 'Files', borderColor: '#fb7185' },
    { key: 'REMINDER', label: 'Reminders', borderColor: '#fbbf24' },
    { key: 'PAYMENT', label: 'Expenses', borderColor: '#818cf8' },
    { key: 'CALENDAR', label: 'Calendar', borderColor: '#818cf8' },
    { key: 'FOLDER', label: 'Folders', borderColor: '#94a3b8' }
  ];

  const defaultPreferences = {
    NOTE: 'IN_APP_ONLY',
    LIST: 'BOTH',
    LINKS: 'IN_APP_ONLY',
    GALLERY: 'IN_APP_ONLY',
    REMINDER: 'BOTH',
    PAYMENT: 'BOTH',
    CALENDAR: 'BOTH',
    FOLDER: 'IN_APP_ONLY'
  };

  useEffect(() => {
    if (group?.id && activeTab === 'notifications') {
      fetchNotificationPreferences();
    }
  }, [group?.id, activeTab]);

  useEffect(() => {
    setName(group?.displayName || '');
  }, [group?.displayName]);

  useEffect(() => {
    if (activeTab === 'reorder' && sections) {
      setLocalSections(Array.isArray(sections) ? [...sections] : []);
    }
  }, [activeTab, sections]);

  useEffect(() => {
    if (group?.id && activeTab === 'activity' && activityLog.length === 0) {
      fetchActivity(0);
    }
  }, [group?.id, activeTab]);

  const fetchActivity = async (page) => {
    try {
      setActivityLoading(true);
      const res = await axiosClient.get(`/groups/${group.id}/activity`, { params: { page, size: 20 } });
      const data = res.data || [];
      setActivityLog(prev => page === 0 ? data : [...prev, ...data]);
      setActivityPage(page);
      setActivityHasMore(data.length === 20);
    } catch {
      // silent
    } finally {
      setActivityLoading(false);
    }
  };

  const formatActivityAction = (entry) => {
    const labels = {
      SECTION_CREATED: 'created section',
      SECTION_DELETED: 'deleted section',
      SECTION_RENAMED: 'renamed section to',
      ITEM_ADDED: 'added item',
      ITEM_COMPLETED: 'completed',
      ITEM_DELETED: 'deleted item',
      NOTE_UPDATED: 'updated note in',
      REMINDER_CREATED: 'added reminder',
      EXPENSE_ADDED: 'added expense',
      EVENT_CREATED: 'created event',
      EVENT_DELETED: 'deleted event',
      FILE_UPLOADED: 'uploaded file',
      MEMBER_JOINED: 'joined the group',
      MEMBER_REMOVED: 'was removed from group',
      GROUP_RENAMED: 'renamed group to',
    };
    const verb = labels[entry.actionType] || entry.actionType?.toLowerCase().replace(/_/g, ' ');
    return entry.entityName ? `${verb} "${entry.entityName}"` : verb;
  };

  const renderActivityTab = () => {
    const grouped = activityLog.reduce((acc, entry) => {
      const d = new Date(entry.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      let label;
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      else label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[label]) acc[label] = [];
      acc[label].push(entry);
      return acc;
    }, {});

    const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <History size={15} className="text-gray-400" /> Activity log
          </h3>
          <button type="button" onClick={() => fetchActivity(0)} className="text-xs text-blue-600 hover:underline">
            Refresh
          </button>
        </div>

        {activityLoading && activityLog.length === 0 && (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
        )}

        {!activityLoading && activityLog.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-10">No activity recorded yet.</p>
        )}

        <div className="space-y-4">
          {Object.entries(grouped).map(([label, entries]) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              <div className="space-y-0 rounded-xl border border-gray-100 overflow-hidden">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    onClick={() => handleActivityEntryClick(entry)}
                    className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''} ${entry.sectionId ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {entry.actorPfpUrl
                        ? <img src={entry.actorPfpUrl} alt={entry.actorName} className="w-full h-full object-cover" />
                        : initials(entry.actorName)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-snug">
                        <span className="font-medium">{entry.actorName || 'Someone'}</span>
                        {' '}{formatActivityAction(entry)}
                      </p>
                      {entry.sectionName && entry.actionType !== 'SECTION_CREATED' && entry.actionType !== 'SECTION_DELETED' && (
                        <p className="text-[10px] text-gray-400 mt-0.5">in {entry.sectionName}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                      {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {activityHasMore && !activityLoading && activityLog.length > 0 && (
          <button
            type="button"
            onClick={() => fetchActivity(activityPage + 1)}
            className="mt-4 w-full text-xs text-blue-600 hover:underline text-center"
          >
            Load more
          </button>
        )}
      </div>
    );
  };

  const fetchNotificationPreferences = async () => {
    try {
      setPrefsLoading(true);
      const response = await axiosClient.get(`/notifications/preferences/${group.id}`);
      setNotificationPrefs({
        sectionPreferences: {
          ...defaultPreferences,
          ...(response.data.sectionPreferences || {})
        }
      });
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      // Keep defaults if fetch fails
    } finally {
      setPrefsLoading(false);
    }
  };

  const updateNotificationPreference = async (sectionType, notifType) => {
    const currentMode = notificationPrefs.sectionPreferences[sectionType];
    let newMode;

    // Toggle logic based on which toggle was clicked
    if (notifType === 'in-app') {
      if (currentMode === 'BOTH' || currentMode === 'IN_APP_ONLY') {
        // Turn off in-app
        newMode = currentMode === 'BOTH' ? 'PUSH_ONLY' : 'NONE';
      } else {
        // Turn on in-app
        newMode = currentMode === 'PUSH_ONLY' ? 'BOTH' : 'IN_APP_ONLY';
      }
    } else if (notifType === 'push') {
      if (currentMode === 'BOTH' || currentMode === 'PUSH_ONLY') {
        // Turn off push
        newMode = currentMode === 'BOTH' ? 'IN_APP_ONLY' : 'NONE';
      } else {
        // Turn on push
        newMode = currentMode === 'IN_APP_ONLY' ? 'BOTH' : 'PUSH_ONLY';
      }
    }

    const updatedPrefs = {
      inAppEnabled: true,
      pushEnabled: true,
      sectionPreferences: {
        ...notificationPrefs.sectionPreferences,
        [sectionType]: newMode
      }
    };
    
    setNotificationPrefs(updatedPrefs);

    try {
      await axiosClient.put(`/notifications/preferences/${group.id}`, updatedPrefs);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      toast.error('Failed to update preferences');
      // Revert on error
      setNotificationPrefs(notificationPrefs);
    }
  };

  const resetToDefaults = async () => {
    const updatedPrefs = {
      inAppEnabled: true,
      pushEnabled: true,
      sectionPreferences: defaultPreferences
    };
    
    setNotificationPrefs(updatedPrefs);

    try {
      await axiosClient.put(`/notifications/preferences/${group.id}`, updatedPrefs);
      toast.success('Reset to default preferences');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast.error('Failed to reset preferences');
    }
  };

  const isInAppEnabled = (sectionType) => {
    const mode = notificationPrefs.sectionPreferences[sectionType];
    return mode === 'BOTH' || mode === 'IN_APP_ONLY';
  };

  const isPushEnabled = (sectionType) => {
    const mode = notificationPrefs.sectionPreferences[sectionType];
    return mode === 'BOTH' || mode === 'PUSH_ONLY';
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result || {};
    if (!destination || !source) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    setLocalSections((prev) => {
      const updated = Array.from(prev);
      const [moved] = updated.splice(source.index, 1);
      if (!moved) return prev;
      updated.splice(destination.index, 0, moved);
      return updated;
    });
  };

  const handleSaveReorder = async () => {
    if (onReorderSections) {
      const orderedIds = localSections.map((item) => item.id);
      await onReorderSections(orderedIds);
      toast.success('Section order updated');
    }
  };

  const TYPE_META = {
    NOTE:     { label: 'Note',      color: '#60a5fa', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
    LIST:     { label: 'Checklist', color: '#34d399', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    LINKS:    { label: 'Links',     color: '#38bdf8', badge: 'bg-sky-50 text-sky-700 border-sky-100' },
    GALLERY:  { label: 'Files',     color: '#fb7185', badge: 'bg-rose-50 text-rose-700 border-rose-100' },
    REMINDER: { label: 'Reminder',  color: '#fbbf24', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
    PAYMENT:  { label: 'Expenses',  color: '#818cf8', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    CALENDAR: { label: 'Calendar',  color: '#a78bfa', badge: 'bg-purple-50 text-purple-700 border-purple-100' },
    FOLDER:   { label: 'Folder',    color: '#94a3b8', badge: 'bg-slate-50 text-slate-700 border-slate-100' },
  };
  const getTypeMeta = (type) => TYPE_META[type] || { label: type || '', color: '#e5e7eb', badge: 'bg-gray-100 text-gray-600 border-gray-200' };

  const handleSave = async () => {
    if (!isAdmin || !onUpdateGroupName) return;
    await onUpdateGroupName(name.trim());
  };

  const handleRoleChange = async (member, newRole) => {
    if (!isOwner) return;
    setUpdatingRole(member.userId);
    try {
      await axiosClient.patch(`/groups/${group.id}/members/${member.userId}/role`, { role: newRole });
      toast.success(`${member.firstName} is now ${newRole}`);
      // Brief reload to reflect change
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDefaultRoleChange = async (newRole) => {
    if (!isOwner) return;
    setUpdatingDefaultRole(true);
    try {
      await axiosClient.patch(`/groups/${group.id}/default-role`, { role: newRole });
      setDefaultMemberRole(newRole);
      toast.success(`New members will now join as ${newRole}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update default role');
    } finally {
      setUpdatingDefaultRole(false);
    }
  };

  const renderManageTab = () => (
    <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-4 text-sm">
      {/* Group details */}
      <section>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Group Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Invite code</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate">
                {group?.inviteCode}
              </span>
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                onClick={() => {
                  if (!group?.inviteCode) return;
                  navigator.clipboard.writeText(group.inviteCode)
                    .then(() => {
                      toast.success('Invite code copied');
                    })
                    .catch(() => {
                      toast.error('Could not copy invite code');
                    });
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              Save changes
            </button>
          </div>
        )}
      </section>

      {/* Sections and members */}
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sections</h3>
            {isAdmin && (
              <button
                type="button"
                onClick={onAddSection}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
              >
                <PlusCircle size={12} />
                Add section
              </button>
            )}
          </div>
          <div className="border rounded-lg max-h-56 sm:max-h-72 overflow-y-auto divide-y divide-gray-100 bg-gray-50">
            {sections && sections.length > 0 ? (
              sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 text-xs text-gray-700">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{s.type}</p>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => onDeleteSection && onDeleteSection(s)}
                      className="inline-flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-[11px] text-gray-400 text-center">No sections yet.</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Members</h3>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
              {members ? members.length : 0}
            </span>
          </div>
          {isAdmin && onInviteByEmail && (
            <div className="mb-2 flex flex-col gap-1">
              <label className="text-[11px] text-gray-500">Invite by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  disabled={!inviteEmail || sendingInvite}
                  onClick={async () => {
                    if (!inviteEmail || !onInviteByEmail) return;
                    try {
                      setSendingInvite(true);
                      await onInviteByEmail(inviteEmail.trim());
                      setInviteEmail('');
                    } finally {
                      setSendingInvite(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-medium disabled:opacity-60 hover:bg-blue-700"
                >
                  {sendingInvite ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          )}
          <div ref={kebabRef} className="border rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white">
            {members && members.length > 0 ? (
              members.map((m) => {
                const initials = `${m.firstName?.charAt(0) || ''}${m.lastName?.charAt(0) || ''}`.toUpperCase();
                const roleBadge = {
                  OWNER:  <span className="text-[9px] font-medium px-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Owner</span>,
                  ADMIN:  <span className="text-[9px] font-medium px-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">Admin</span>,
                  MEMBER: <span className="text-[9px] font-medium px-1.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Member</span>,
                  VIEWER: <span className="text-[9px] font-medium px-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">Viewer</span>,
                }[m.role] || null;

                const canActOn = m.role !== 'OWNER' && (isOwner || isAdmin);

                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition cursor-pointer group"
                    onClick={() => onViewMember && onViewMember(m)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {m.pfpUrl
                          ? <img src={m.pfpUrl} alt={`${m.firstName} ${m.lastName}`} className="w-full h-full rounded-full object-cover" />
                          : <span className="text-xs font-medium text-blue-700">{initials}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-medium truncate" style={{ color: '#111827' }}>{m.firstName} {m.lastName}</p>
                          {roleBadge}
                        </div>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: '#6b7280' }}>{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {canActOn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openKebabId === m.userId) {
                              setOpenKebabId(null);
                              setKebabPos(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setKebabPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenKebabId(m.userId);
                            }
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <MoreVertical size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-[11px] text-gray-400 text-center">No members.</div>
            )}
          </div>
        </section>
      </div>

      {/* Join requests (admin only) */}
      {isAdmin && joinRequests && joinRequests.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Pending requests ({joinRequests.length})
          </h3>
          <div className="border rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 bg-white">
            {joinRequests.map((req) => (
              <div key={req.memberId} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {req.firstName} {req.lastName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{req.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (processingRequests[req.memberId]) return;
                      setProcessingRequests(prev => ({ ...prev, [req.memberId]: true }));
                      try {
                        await onApproveJoinRequest(req.memberId);
                      } finally {
                        setProcessingRequests(prev => {
                          const newState = { ...prev };
                          delete newState[req.memberId];
                          return newState;
                        });
                      }
                    }}
                    disabled={processingRequests[req.memberId]}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingRequests[req.memberId] ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (processingRequests[req.userId]) return;
                      setProcessingRequests(prev => ({ ...prev, [req.userId]: true }));
                      try {
                        await onRejectJoinRequest(req.userId);
                      } finally {
                        setProcessingRequests(prev => {
                          const newState = { ...prev };
                          delete newState[req.userId];
                          return newState;
                        });
                      }
                    }}
                    disabled={processingRequests[req.userId]}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 text-[10px] font-medium hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingRequests[req.userId] ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Default member role — Owner only */}
      {isOwner && (
        <section className="border border-amber-100 rounded-xl p-3 bg-amber-50/40">
          <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Default Member Role</h3>
          <p className="text-[11px] text-gray-500 mb-2">New members who join via invite code will be assigned this role.</p>
          <div className="flex items-center gap-2">
            {['MEMBER', 'ADMIN', 'VIEWER'].map((role) => (
              <button
                key={role}
                type="button"
                disabled={updatingDefaultRole}
                onClick={() => defaultMemberRole !== role && setDefaultRoleConfirm(role)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium border transition
                  ${defaultMemberRole === role
                    ? role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : role === 'VIEWER'
                      ? 'bg-teal-100 text-teal-700 border-teal-300'
                      : 'bg-gray-200 text-gray-800 border-gray-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Danger Zone */}
      <section className="border-t pt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">Danger Zone</h3>
          <p className="text-[11px] text-red-600 mb-3">
            {isOwner
              ? 'Deleting the group will permanently remove it for all members.'
              : 'You will be removed from this group and lose access to its sections.'}
          </p>
          <div className="flex justify-start">
            {isOwner ? (
              <button
                type="button"
                onClick={onDeleteGroup}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm"
              >
                Delete group
              </button>
            ) : onLeaveGroup ? (
              <button
                type="button"
                onClick={onLeaveGroup}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm"
              >
                Leave group
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );

  const renderReorderTab = () => (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Reorder sections</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Drag to reorder — this order is personal to you.</p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="reorder-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="overflow-y-auto space-y-1.5 py-3 flex-1 min-h-0"
            >
              {localSections.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">
                  No sections to reorder.
                </div>
              )}
              {localSections.map((item, index) => {
                const { label, color, badge } = getTypeMeta(item.type);
                return (
                  <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`flex items-center gap-3 rounded-lg border pl-0 pr-3 py-2.5 text-xs transition-colors ${
                          snapshot.isDragging
                            ? 'border-blue-300 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:bg-gray-50/80'
                        }`}
                        style={{
                          ...dragProvided.draggableProps.style,
                          borderLeftColor: color,
                          borderLeftWidth: '3px',
                        }}
                      >
                        {/* Index */}
                        <span className="w-6 text-center text-[10px] font-semibold text-gray-300 flex-shrink-0 pl-2">
                          {index + 1}
                        </span>
                        {/* Title */}
                        <p className="flex-1 truncate text-gray-800 text-xs font-medium min-w-0">{item.title}</p>
                        {/* Type badge */}
                        {label && (
                          <span className={`inline-flex flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge}`}>
                            {label}
                          </span>
                        )}
                        {/* Drag handle */}
                        <button
                          type="button"
                          {...dragProvided.dragHandleProps}
                          className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical size={14} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {localSections.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0">
          <span className="text-[11px] text-gray-400">{localSections.length} section{localSections.length !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={handleSaveReorder}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Save order
          </button>
        </div>
      )}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Notification Preferences</h3>
        <p className="text-xs text-gray-500 mb-3">
          Control how you receive notifications for each section type
        </p>
        <div className="flex items-center gap-4 text-[11px] text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5">
            <Bell size={14} className="text-blue-600" />
            <span>In-app: Bell icon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone size={14} className="text-purple-600" />
            <span>Push: Browser popup</span>
          </div>
        </div>
      </div>

      {prefsLoading ? (
        <div className="text-xs text-gray-400">Loading preferences...</div>
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {sectionTypes.map(section => (
              <div 
                key={section.key} 
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border-l-4 border-y border-r border-gray-200"
                style={{ borderLeftColor: section.borderColor }}
              >
                <span className="text-sm font-medium text-gray-700">
                  {section.label}
                </span>
                <div className="flex items-center gap-4">
                  {/* In-app toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">In-app</span>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference(section.key, 'in-app')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isInAppEnabled(section.key) ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isInAppEnabled(section.key) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {/* Push toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Push</span>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference(section.key, 'push')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isPushEnabled(section.key) ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPushEnabled(section.key) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 border border-gray-300"
            >
              <RotateCcw size={14} />
              Reset to defaults
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 sm:px-0">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[82vh] sm:max-h-[90vh] flex flex-col">
        {/* Header with Tabs */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Group Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your group settings and preferences
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b -mb-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Manage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reorder')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reorder'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reorder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'manage' && renderManageTab()}
          {activeTab === 'reorder' && renderReorderTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'activity' && renderActivityTab()}
        </div>
      </div>

      {roleChangeConfirm && (
        <ConfirmModal
          title="Change member role?"
          message={`Set ${roleChangeConfirm.member.firstName} ${roleChangeConfirm.member.lastName} as ${roleChangeConfirm.newRole.charAt(0) + roleChangeConfirm.newRole.slice(1).toLowerCase()} in this group?`}
          confirmLabel="Change role"
          onCancel={() => setRoleChangeConfirm(null)}
          onConfirm={async () => {
            const { member, newRole } = roleChangeConfirm;
            setRoleChangeConfirm(null);
            await handleRoleChange(member, newRole);
          }}
        />
      )}

      {defaultRoleConfirm && (
        <ConfirmModal
          title="Change default join role?"
          message={`New members who join via invite code will be assigned the "${defaultRoleConfirm.charAt(0) + defaultRoleConfirm.slice(1).toLowerCase()}" role. Existing members are not affected.`}
          confirmLabel="Change role"
          onCancel={() => setDefaultRoleConfirm(null)}
          onConfirm={() => {
            handleDefaultRoleChange(defaultRoleConfirm);
            setDefaultRoleConfirm(null);
          }}
        />
      )}

      {openKebabId && kebabPos && createPortal(
        <div
          ref={kebabRef}
          style={{ position: 'fixed', top: kebabPos.top, right: kebabPos.right, zIndex: 9999 }}
          className="w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1"
        >
          {(() => {
            const m = members?.find(mem => mem.userId === openKebabId);
            if (!m) return null;
            return (
              <>
                {isOwner && ['ADMIN', 'MEMBER', 'VIEWER'].filter(r => r !== m.role).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setOpenKebabId(null); setKebabPos(null); setRoleChangeConfirm({ member: m, newRole: r }); }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Set as {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setOpenKebabId(null); setKebabPos(null); onRemoveMember && onRemoveMember(m); }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove from group
                </button>
              </>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SettingsModal;