import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axiosClient from '../../api/axiosClient';
import ConfirmModal from '../ConfirmModal';
import { toast } from 'react-toastify';
import { ExternalLink, Copy, Edit2, Trash2, GripVertical, Check, Search } from 'lucide-react';

function getFavicon(url) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const emptyLink = { id: null, key: '', url: '', description: '' };

export default function LinksSection({ sectionId }) {
  const [links, setLinks] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(emptyLink);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [error, setError] = useState('');
  const [lastCopiedId, setLastCopiedId] = useState(null);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!sectionId) return;
      try {
        const res = await axiosClient.get(`/groups/sections/${sectionId}/links`);
        setLinks(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to fetch links', e);
      }
    };
    fetchLinks();
  }, [sectionId]);

  const refreshLinks = async () => {
    if (!sectionId) return;
    try {
      const res = await axiosClient.get(`/groups/sections/${sectionId}/links`);
      setLinks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to refresh links', e);
    }
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.url.trim()) {
      setError('Key and URL are required.');
      return;
    }
    if (!isValidUrl(form.url)) {
      setError('Invalid URL format.');
      return;
    }
    try {
      const payload = {
        key: form.key.trim(),
        url: form.url.trim(),
        description: form.description ? form.description.trim() : '',
      };
      if (editingIndex !== null) {
        const existing = links[editingIndex];
        await axiosClient.put(`/groups/sections/links/${existing.id}`, payload);
      } else {
        await axiosClient.post(`/groups/sections/${sectionId}/links`, payload);
      }
      await refreshLinks();
      setForm(emptyLink);
      setEditingIndex(null);
      setError('');
    } catch (e) {
      console.error('Failed to save link', e);
      setError('Failed to save link. Please try again.');
    }
  };

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
      if (id) {
        setLastCopiedId(id);
        setTimeout(() => setLastCopiedId(null), 1500);
      }
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const confirmDelete = async () => {
    if (deleteIndex === null || !links[deleteIndex]) return;
    const target = links[deleteIndex];
    try {
      await axiosClient.delete(`/groups/sections/links/${target.id}`);
      await refreshLinks();
    } catch (e) {
      console.error('Failed to delete link', e);
    } finally {
      setDeleteIndex(null);
    }
  };

  const moveLink = async (from, to) => {
    if (to < 0 || to >= links.length) return;
    const updated = [...links];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setLinks(updated);
    try {
      await axiosClient.patch(`/groups/sections/${sectionId}/links/reorder`, updated.map(l => l.id));
    } catch (e) {
      console.error('Failed to reorder links', e);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result || {};
    if (!destination || source.index === destination.index) return;
    moveLink(source.index, destination.index);
  };

  // Render a single link row — regular function, NOT a React component,
  // so React never unmounts/remounts it during parent re-renders (prevents image flicker).
  const renderLinkRow = (link, originalIndex, dragHandleProps, isDragging) => (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-white transition group ${
      isDragging ? 'border-blue-300 shadow-md' : 'border-gray-100 hover:border-blue-100 hover:shadow-sm'
    }`}>
      {/* Drag handle — left side, only in DnD mode */}
      {dragHandleProps ? (
        <button
          type="button"
          {...dragHandleProps}
          className="flex-shrink-0 p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : (
        // Spacer so layout doesn't shift when filter is active
        <span className="w-5 flex-shrink-0" />
      )}

      {/* Favicon */}
      <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {getFavicon(link.url) ? (
          <>
            <img
              src={getFavicon(link.url)}
              alt=""
              className="w-4 h-4 object-contain"
              loading="lazy"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            />
            <span className="text-[10px] text-sky-500 font-semibold hidden items-center justify-center w-full h-full">URL</span>
          </>
        ) : (
          <span className="text-[10px] text-sky-500 font-semibold">URL</span>
        )}
      </div>

      {/* Title + description */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-900 truncate"
          >
            {link.key || link.url}
          </a>
          <button
            type="button"
            onClick={() => handleCopy(link.url, link.id)}
            className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
            title="Copy link"
          >
            {lastCopiedId === link.id
              ? <Check className="w-4 h-4 text-emerald-500" />
              : <Copy className="w-3 h-3" />}
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[11px] text-gray-500 truncate">{link.description || link.url}</p>
      </div>

      {/* Edit / Delete — revealed on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <button
          type="button"
          onClick={() => { setEditingIndex(originalIndex); setForm({ ...link }); setError(''); }}
          className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100"
          title="Edit"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteIndex(originalIndex)}
          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  const filteredLinks = filterText
    ? links.filter(l =>
        l.key?.toLowerCase().includes(filterText.toLowerCase()) ||
        l.description?.toLowerCase().includes(filterText.toLowerCase()) ||
        l.url?.toLowerCase().includes(filterText.toLowerCase())
      )
    : links;

  return (
    <div className="h-full flex flex-col p-0 sm:p-4">
      <div className="w-full h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Links</h2>
          <p className="text-xs text-gray-500 mt-1">
            Save important URLs with labels so your group can quickly jump to docs, dashboards and tools.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="space-y-2"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                placeholder="Label, e.g. Team docs"
                className="w-full sm:flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none placeholder:text-gray-400"
                required
              />
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/page"
                className="w-full sm:flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none placeholder:text-gray-400"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description (optional)"
                className="w-full sm:flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium transition disabled:opacity-60"
                disabled={!form.key.trim() || !form.url.trim()}
              >
                {editingIndex !== null ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>

        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        {links.length > 4 && (
          <div className="relative mb-3 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Filter links…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {links.length === 0 ? (
            <div className="text-xs text-gray-400">No links yet. Add your first link above.</div>
          ) : filterText ? (
            /* Filtered view — plain list, no drag */
            <div className="space-y-2">
              {filteredLinks.map((link) => {
                const originalIndex = links.indexOf(link);
                return (
                  <div key={link.id ?? originalIndex}>
                    {renderLinkRow(link, originalIndex, null, false)}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Full list with drag-and-drop */
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="links-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {links.map((link, i) => (
                      <Draggable key={link.id ?? i} draggableId={String(link.id ?? i)} index={i}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                          >
                            {renderLinkRow(link, i, dragProvided.dragHandleProps, snapshot.isDragging)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {deleteIndex !== null && (
        <ConfirmModal
          title="Delete link?"
          message="Are you sure you want to delete this link?"
          confirmLabel="Delete"
          onCancel={() => setDeleteIndex(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
