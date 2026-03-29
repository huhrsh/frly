import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Bell, Smartphone, Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';
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
  
  const isAdmin = group?.currentUserRole === 'ADMIN';

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

  const getTypeMeta = (type) => {
    switch (type) {
      case 'NOTE': return { label: 'Note', badgeClass: 'bg-blue-50 text-blue-700' };
      case 'LIST': return { label: 'Checklist', badgeClass: 'bg-emerald-50 text-emerald-700' };
      case 'LINKS': return { label: 'Links', badgeClass: 'bg-sky-50 text-sky-700' };
      case 'GALLERY': return { label: 'Files', badgeClass: 'bg-rose-50 text-rose-700' };
      case 'REMINDER': return { label: 'Reminders', badgeClass: 'bg-amber-50 text-amber-700' };
      case 'PAYMENT': return { label: 'Expenses', badgeClass: 'bg-indigo-50 text-indigo-700' };
      case 'CALENDAR': return { label: 'Calendar', badgeClass: 'bg-indigo-50 text-indigo-700' };
      case 'FOLDER': return { label: 'Folder', badgeClass: 'bg-slate-50 text-slate-700' };
      default: return { label: type, badgeClass: 'bg-gray-100 text-gray-600' };
    }
  };

  const handleSave = async () => {
    if (!isAdmin || !onUpdateGroupName) return;
    await onUpdateGroupName(name.trim());
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
                  {isAdmin && (
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
          <div className="border rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white">
            {members && members.length > 0 ? (
              members.map((m) => {
                const initials = `${m.firstName?.charAt(0) || ''}${m.lastName?.charAt(0) || ''}`.toUpperCase();
                const isCurrentUserAdmin = m.role === 'ADMIN';
                
                return (
                  <div 
                    key={m.userId} 
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition cursor-pointer group"
                    onClick={() => onViewMember && onViewMember(m)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Avatar with initials */}
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {   m.pfpUrl ? 
                            <img src={m.pfpUrl} alt={`${m.firstName} ${m.lastName}`} className="w-full h-full rounded-full object-cover" />:
                            <span className="text-xs font-medium text-blue-700">{initials}</span>

                        }
                      </div>
                      
                      {/* Name and email */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate group-hover:text-blue-600" style={{ color: '#111827' }}>
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: '#6b7280' }}>
                          {m.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Show ADMIN badge for admins, Remove button for non-admins (if viewer is admin) */}
                    {isCurrentUserAdmin ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                        ADMIN
                      </span>
                    ) : (
                      isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMember && onRemoveMember(m);
                          }}
                          className="text-[10px] text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 flex-shrink-0"
                        >
                          Remove
                        </button>
                      )
                    )}
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

      {/* Danger Zone */}
      <section className="border-t pt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">Danger Zone</h3>
          <p className="text-[11px] text-red-600 mb-3">
            {isAdmin 
              ? 'Deleting the group will remove it for all members.'
              : 'You will be removed from this group and lose access to its sections.'}
          </p>
          <div className="flex justify-start">
            {!isAdmin && (
              <button
                type="button"
                onClick={onLeaveGroup}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm"
              >
                Leave group
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onDeleteGroup}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm"
              >
                Delete group
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  const renderReorderTab = () => (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Reorder Sections</h3>
        <p className="text-xs text-gray-500">
          Drag items using the handle to change their order
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="reorder-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="max-h-96 overflow-y-auto space-y-2 mb-4"
            >
              {localSections.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-lg">
                  No sections to reorder.
                </div>
              )}
              {localSections.map((item, index) => {
                const { label, badgeClass } = getTypeMeta(item.type);
                return (
                  <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 bg-white max-w-md ${
                          snapshot.isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                        }`}
                      >
                        <div
                          {...dragProvided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
                          {label}
                        </span>
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveReorder}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Save Order
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
          <div className="flex gap-1 border-b -mb-4">
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
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'manage' && renderManageTab()}
          {activeTab === 'reorder' && renderReorderTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;