import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { Trash2, PlusCircle, MoreVertical } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import ConfirmModal from './ConfirmModal';

const RoleBadge = ({ role }) => {
  if (role === 'OWNER') return (
    <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] uppercase">Owner</span>
  );
  if (role === 'ADMIN') return (
    <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[9px] uppercase">Admin</span>
  );
  if (role === 'VIEWER') return (
    <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-[9px] uppercase">Viewer</span>
  );
  return null;
};

const GroupManageModal = ({
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
  onApproveJoinRequest
}) => {
  const [name, setName] = useState(group?.displayName || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [updatingDefaultRole, setUpdatingDefaultRole] = useState(false);
  const [openKebabId, setOpenKebabId] = useState(null);
  const [kebabPos, setKebabPos] = useState(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState(null);
  const kebabRef = useRef(null);

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
      // Refresh member list — caller should handle via onClose/refresh
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
      toast.success(`New members will now join as ${newRole}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update default role');
    } finally {
      setUpdatingDefaultRole(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 sm:px-0">
    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[82vh] sm:max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{isAdmin ? 'Manage group' : 'Group info'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAdmin
                ? 'View and manage group details, sections, and members.'
                : 'View group details, sections, and members.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
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
                        .then(() => toast.success('Invite code copied'))
                        .catch(() => toast.error('Could not copy invite code'));
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

          {/* Default member role (Owner only) */}
          {isOwner && (
            <section className="border border-amber-100 rounded-xl p-3 bg-amber-50/40">
              <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Default Member Role</h3>
              <p className="text-[11px] text-gray-500 mb-2">New members who join via invite code will be assigned this role.</p>
              <div className="flex items-center gap-2">
                {['MEMBER', 'ADMIN', 'VIEWER'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={updatingDefaultRole}
                    onClick={() => handleDefaultRoleChange(role)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition
                      ${group?.defaultMemberRole === role
                        ? role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : role === 'VIEWER'
                          ? 'bg-teal-100 text-teal-700 border-teal-300'
                          : 'bg-gray-200 text-gray-800 border-gray-300'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </section>
          )}

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
                      {sendingInvite ? 'Sending…' : 'Send invite'}
                    </button>
                  </div>
                </div>
              )}
              <div className="border rounded-lg max-h-40 sm:max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50">
                {members && members.length > 0 ? (
                  members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.pfpUrl ? (
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                            <img
                              src={m.pfpUrl}
                              alt={m.firstName || m.email || 'Member avatar'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-semibold text-blue-600 border border-blue-100 shrink-0">
                            {((m.firstName?.[0] || '') + (m.lastName?.[0] || '') || (m.email?.[0] || '?')).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              className="font-medium truncate text-left hover:underline"
                              onClick={() => onViewMember && onViewMember(m)}
                              title={`${m.firstName || ''} ${m.lastName || ''} \n${m.email || ''}`}
                            >
                              {m.firstName} {m.lastName}
                            </button>
                            <RoleBadge role={m.role} />
                          </div>
                          {m.email && (
                            <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.role !== 'OWNER' && (isOwner || isAdmin) && (
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
                  ))
                ) : (
                  <div className="px-3 py-4 text-[11px] text-gray-400 text-center">No members found.</div>
                )}
              </div>

              {isAdmin && joinRequests && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Join requests</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px]">
                      {joinRequests.length}
                    </span>
                  </div>
                  {joinRequests.length === 0 ? (
                    <p className="px-3 py-3 text-[11px] text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                      No pending join requests.
                    </p>
                  ) : (
                    <div className="border rounded-lg max-h-32 overflow-y-auto divide-y divide-gray-100 bg-gray-50 mt-1">
                      {joinRequests.map((req) => (
                        <div key={req.memberId} className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-700">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{req.firstName} {req.lastName}</p>
                            {req.email && (
                              <p className="text-[10px] text-gray-500 truncate">{req.email}</p>
                            )}
                          </div>
                          {onApproveJoinRequest && (
                            <button
                              type="button"
                              onClick={() => onApproveJoinRequest(req.memberId)}
                              className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Danger zone / leave group */}
          {isOwner ? (
            <section className="border-t border-red-100 pt-4 mt-2">
              <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Danger zone</h3>
              <p className="text-[11px] text-red-500 mb-2">Deleting the group will archive it for all members.</p>
              <button
                type="button"
                onClick={onDeleteGroup}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 bg-white text-[11px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
                Delete group
              </button>
            </section>
          ) : onLeaveGroup ? (
            <section className="border-t border-red-100 pt-4 mt-2">
              <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Leave group</h3>
              <p className="text-[11px] text-gray-600 mb-2">
                You will be removed from this group and lose access to its sections.
              </p>
              <button
                type="button"
                onClick={onLeaveGroup}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 bg-white text-[11px] font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
                Leave group
              </button>
            </section>
          ) : null}
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

export default GroupManageModal;
