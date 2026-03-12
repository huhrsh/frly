import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import ConfirmModal from '../ConfirmModal';
import { toast } from 'react-toastify';
import { ExternalLink, Copy, Edit2, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react';

function getFavicon(url) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}`;
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

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (e) {
      console.error('Failed to copy link', e);
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
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
      const orderedIds = updated.map((l) => l.id);
      await axiosClient.patch(`/groups/sections/${sectionId}/links/reorder`, orderedIds);
    } catch (e) {
      console.error('Failed to reorder links', e);
    }
  };

  return (
    <div className="h-full flex flex-col p-0 sm:p-4">
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Links</h2>
            <p className="text-xs text-gray-500 mt-1">
              Save important URLs with labels so your group can quickly jump to docs, dashboards and tools.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="mb-4 flex flex-col sm:flex-row gap-2 "
        >
          <div className="flex-1 flex flex-col max-w-[50%] sm:flex-row gap-2 ">
            <input
              type="text"
              value={form.key}
              onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
              placeholder="Label, e.g. Team docs"
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-400"
              required
            />
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com/page"
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-400"
              required
            />
          </div>
          <div className="flex sm:w-[50%] gap-2">
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description (optional)"
              className="px-3 py-2.5 flex-grow border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium shadow-sm transition disabled:opacity-60"
              disabled={!form.key.trim() || !form.url.trim()}
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {links.length === 0 ? (
            <div className="text-xs text-gray-400">No links yet. Add your first link above.</div>
          ) : (
            <ul className="space-y-2">
              {links.map((link, i) => (
                <li
                  key={link.id ?? i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {getFavicon(link.url) ? (
                        <img
                          src={getFavicon(link.url)}
                          alt="favicon"
                          className="w-4 h-4 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] text-sky-500 font-semibold">URL</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
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
                          onClick={() => {
                            handleCopy(link.url);
                            if (link.id) {
                              setLastCopiedId(link.id);
                              setTimeout(() => setLastCopiedId(null), 1500);
                            }
                          }}
                          className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70"
                          title="Copy link"
                        >
                          {lastCopiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-full">
                        {link.description || link.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => moveLink(i, i - 1)}
                      disabled={i === 0}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-default"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(i, i + 1)}
                      disabled={i === links.length - 1}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-default"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(i);
                        setForm({ ...links[i] });
                        setError('');
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-white"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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

