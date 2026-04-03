import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Trash2, Edit2, CalendarDays } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { parseUTCDate } from '../../utils/dateUtils';

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

const CalendarView = ({ sectionId }) => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [monthCursor, setMonthCursor] = useState(startOfDay(new Date()));
  const [form, setForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    category: 'GENERAL',
    memberIds: []
  });
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { groupId } = useParams();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get(`/groups/sections/${sectionId}/calendar-events`);
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load calendar events', err);
        toast.error('Failed to load calendar');
      }
    };
    load();
  }, [sectionId]);

  useEffect(() => {
    if (!groupId) return;
    const loadMembers = async () => {
      try {
        const res = await axiosClient.get(`/groups/${groupId}/members`);
        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        // best-effort only
      }
    };
    loadMembers();
  }, [groupId]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.startTime) return;
      const d = startOfDay(ev.startTime);
      const key = d.toISOString();
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    const key = startOfDay(selectedDate).toISOString();
    return (eventsByDay[key] || []).slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [eventsByDay, selectedDate]);

  const daysInMonth = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const days = [];
    for (let i = 0; i < startWeekday; i += 1) {
      days.push(null);
    }
    const daysCount = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysCount; d += 1) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [monthCursor]);

  const handlePrevMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    setMonthCursor(startOfDay(d));
  };

  const handleNextMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    setMonthCursor(startOfDay(d));
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      category: 'GENERAL',
      memberIds: [],
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        startTime: form.start,
        endTime: form.end || null,
        location: form.location,
        category: form.category,
        memberIds: Array.isArray(form.memberIds) ? form.memberIds : [],
      };
      if (editingId) {
        await axiosClient.put(`/groups/sections/calendar-events/${editingId}`, payload);
        toast.success('Event updated');
      } else {
        const res = await axiosClient.post(`/groups/sections/${sectionId}/calendar-events`, payload);
        const id = res.data;
        toast.success('Event added');
      }
      const refreshed = await axiosClient.get(`/groups/sections/${sectionId}/calendar-events`);
      setEvents(Array.isArray(refreshed.data) ? refreshed.data : []);
      resetForm();
    } catch (err) {
      console.error('Failed to save event', err);
      toast.error('Failed to save event');
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    const start = ev.startTime ? parseUTCDate(ev.startTime) : null;
    const end = ev.endTime ? parseUTCDate(ev.endTime) : null;
    const toLocalInput = (dt) => {
      if (!dt) return '';
      const d = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
      return d.toISOString().slice(0, 16);
    };
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      start: toLocalInput(start),
      end: toLocalInput(end),
      location: ev.location || '',
      category: ev.category || 'GENERAL',
      memberIds: Array.isArray(ev.memberIds) ? ev.memberIds : [],
    });
  };

  const requestDelete = (ev) => {
    setDeleteTarget(ev);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/groups/sections/calendar-events/${deleteTarget.id}`);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success('Event deleted');
    } catch (err) {
      console.error('Failed to delete event', err);
      toast.error('Failed to delete event');
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatTimeRange = (ev) => {
    if (!ev.startTime) return '';
    const start = parseUTCDate(ev.startTime);
    const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!ev.endTime) return startStr;
    const end = parseUTCDate(ev.endTime);
    const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${startStr} – ${endStr}`;
  };

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const now = new Date();
  const upcomingEvents = events
    .filter((ev) => {
      if (!ev.startTime) return false;
      const start = parseUTCDate(ev.startTime);
      if (!start) return false;
      const end = ev.endTime ? parseUTCDate(ev.endTime) : null;
      // If we have an end time, treat events as upcoming/current until they finish.
      if (end) {
        return end >= now;
      }
      // Otherwise fall back to start time.
      return start >= now;
    })
    .sort((a, b) => parseUTCDate(a.startTime) - parseUTCDate(b.startTime));

  const pastEvents = events
    .filter((ev) => {
      if (!ev.startTime) return false;
      const start = parseUTCDate(ev.startTime);
      const end = ev.endTime ? parseUTCDate(ev.endTime) : null;
      if (end) {
        return end < now;
      }
      return start < now;
    })
    .sort((a, b) => parseUTCDate(b.startTime) - parseUTCDate(a.startTime));

  return (
    <div className="h-full flex flex-col sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays size={18} />
            Calendar
          </h2>
          <p className="text-xs text-gray-500">Keep everyone in the loop about trips, availability, and key dates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr,1fr] gap-4 flex-1 min-h-0 items-start">
        {/* Left column: calendar + events for this day */}
        <div className="flex flex-col gap-3 lg:max-w-sm">
          {/* Month calendar */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium text-gray-800">{monthLabel}</div>
            <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-[11px] text-gray-400 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <div key={idx} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs mt-1">
            {daysInMonth.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const key = startOfDay(d).toISOString();
              const hasEvents = !!eventsByDay[key];
              const isToday = sameDay(d, new Date());
              const isSelected = sameDay(d, selectedDate);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const day = startOfDay(d);
                    setSelectedDate(day);
                    setMonthCursor(day);

                    if (!editingId) {
                      const base = new Date(day);
                      base.setHours(9, 0, 0, 0);
                      const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                      setForm((prev) => ({ ...prev, start: local }));
                    }
                  }}
                  className={`relative flex items-center justify-center h-9 w-9 aspect-square rounded-full border text-[11px] transition
                    ${isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                      : isToday
                        ? 'border-indigo-200 text-indigo-700 bg-indigo-50'
                        : hasEvents
                          ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          </div>

          {/* Events for this day, directly under the calendar */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Events for this day</p>
              {selectedDayEvents.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedDayEvents.length} event{selectedDayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {selectedDayEvents.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Nothing on the calendar for this day yet.
                </p>
              )}
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-1 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                      </div>
                      <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {formatTimeRange(ev)}
                      </p>
                      {ev.location && (
                        <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {ev.location}
                        </p>
                      )}
                      {ev.description && (
                        <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{ev.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {ev.createdByName && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <User size={12} />
                            Added by {ev.createdByName}
                          </p>
                        )}
                        {Array.isArray(ev.memberIds) && ev.memberIds.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-600">
                            <span className="font-medium">Going:</span>
                            <div className="flex -space-x-1">
                              {ev.memberIds.slice(0, 3).map((id) => {
                                const m = members.find((mm) => mm.userId === id);
                                const initials = m
                                  ? `${(m.firstName || '').charAt(0)}${(m.lastName || '').charAt(0)}`.toUpperCase()
                                  : '?';
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] border border-white"
                                  >
                                    {initials}
                                  </span>
                                );
                              })}
                              {ev.memberIds.length > 3 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[9px] border border-white">
                                  +{ev.memberIds.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => startEdit(ev)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(ev)}
                        className="p-1 rounded-full text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Add event form */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Add event</p>
              <p className="text-sm font-medium text-gray-800">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Trip to hometown, Out of office, Rent payment..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600">Details (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[70px]"
                  placeholder="Who is going, notes for family, booking refs, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-600">Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600">End (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-600">Location (optional)</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Home, Goa, Office, etc."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600">Who is going?</label>
                  <div className="mt-1 border border-gray-200 rounded-lg px-2 py-2 bg-white max-h-28 overflow-y-auto text-sm text-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, memberIds: [] })}
                        className={`px-3 py-1 rounded-full border text-xs transition ${(!form.memberIds || (Array.isArray(form.memberIds) && form.memberIds.length === 0))
                          ? 'bg-gray-200 text-gray-700 border-gray-200'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      >
                        No one
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, memberIds: members.map(m => m.userId) })}
                        className={`px-3 py-1 rounded-full border text-xs transition ${(Array.isArray(form.memberIds) && members.length > 0 && form.memberIds.length === members.length)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
                      >
                        Everyone
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {members.map((m) => {
                        const checked = Array.isArray(form.memberIds) && form.memberIds.includes(m.userId);
                        return (
                          <label key={m.userId} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={checked}
                              onChange={() => {
                                setForm((prev) => {
                                  const current = Array.isArray(prev.memberIds) ? prev.memberIds : [];
                                  const exists = current.includes(m.userId);
                                  return {
                                    ...prev,
                                    memberIds: exists
                                      ? current.filter((id) => id !== m.userId)
                                      : [...current, m.userId],
                                  };
                                });
                              }}
                            />
                            <span className="truncate text-[13px]">
                              {m.firstName} {m.lastName}
                            </span>
                          </label>
                        );
                      })}
                      {members.length === 0 && (
                        <p className="text-[11px] text-gray-400">No members loaded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-indigo-700"
                >
                  {editingId ? 'Update event' : 'Add to calendar'}
                </button>
              </div>
            </form>
        </div>

        {/* Right column: upcoming and past events */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
          <div className="w-full flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Upcoming events</p>
              </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {upcomingEvents.slice(0, 8).map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs text-gray-800 py-1">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ev.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {parseUTCDate(ev.startTime)?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                        · {parseUTCDate(ev.startTime)?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {ev.location && (
                        <p className="text-[11px] text-gray-500 truncate">
                          <MapPin size={10} className="inline mr-1" />
                          {ev.location}
                        </p>
                      )}
                    </div>
                    {Array.isArray(ev.memberIds) && ev.memberIds.length > 0 && (
                      <span className="ml-2 text-[11px] text-gray-500 whitespace-nowrap">
                        {ev.memberIds.length} going
                      </span>
                    )}
                  </div>
                ))}
              {upcomingEvents.length === 0 && (
                <p className="text-xs text-gray-400">No upcoming events.</p>
              )}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Past events</p>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {pastEvents.slice(0, 8).map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs text-gray-800 py-1">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ev.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {parseUTCDate(ev.startTime)?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                        · {parseUTCDate(ev.startTime)?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {ev.location && (
                        <p className="text-[11px] text-gray-500 truncate">
                          <MapPin size={10} className="inline mr-1" />
                          {ev.location}
                        </p>
                      )}
                    </div>
                    {Array.isArray(ev.memberIds) && ev.memberIds.length > 0 && (
                      <span className="ml-2 text-[11px] text-gray-500 whitespace-nowrap">
                        {ev.memberIds.length} went
                      </span>
                    )}
                  </div>
                ))}
                {pastEvents.length === 0 && (
                  <p className="text-xs text-gray-400">No past events yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete event?"
          message={`Delete "${deleteTarget.title || 'this event'}" from the calendar?`}
          confirmLabel="Delete event"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}
    </div>
  );
};

export default CalendarView;
