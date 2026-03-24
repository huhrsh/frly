import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import ConfirmModal from '../ConfirmModal';

const ListView = ({ sectionId, section }) => {
    const [items, setItems] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [displayMode, setDisplayMode] = useState(() => {
        const mode = section?.listDisplayMode || 'CHECKBOX';
        // Normalize enum format from backend (CHECKBOX_STATIC) to frontend (CHECKBOX-STATIC)
        return typeof mode === 'string' ? mode.replace(/_/g, '-') : mode;
    });

    useEffect(() => {
        fetchItems();
    }, [sectionId]);

    useEffect(() => {
        const mode = section?.listDisplayMode || 'CHECKBOX';
        // Normalize enum format from backend (CHECKBOX_STATIC) to frontend (CHECKBOX-STATIC)
        const normalizedMode = typeof mode === 'string' ? mode.replace(/_/g, '-') : mode;
        setDisplayMode(normalizedMode);
    }, [section?.id, section?.listDisplayMode]);

    const fetchItems = async () => {
        try {
            const res = await axiosClient.get(`/groups/sections/${sectionId}/items`);
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch list items", error);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (isAdding) return;

        const text = newItemText.trim();
        if (!text) return;

        setIsAdding(true);
        try {
            await axiosClient.post(`/groups/sections/${sectionId}/items`, {
                text,
                sectionId
            });
            setNewItemText('');
            fetchItems();
        } catch (error) {
            console.error("Failed to add item", error);
        } finally {
            setIsAdding(false);
        }
    };

    const toggleItem = async (item) => {
        // Optimistic update
        const updatedItems = items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i);
        setItems(updatedItems);

        try {
            await axiosClient.patch(`/groups/sections/items/${item.id}/toggle`);
        } catch (error) {
            console.error("Failed to update item", error);
            fetchItems(); // Revert on error
        }
    };

    const deleteItem = async (itemId) => {
        try {
            await axiosClient.delete(`/groups/sections/items/${itemId}`);
            setItems(items.filter(i => i.id !== itemId));
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const startEdit = (item) => {
        setEditingItemId(item.id);
        setEditingText(item.text || '');
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setEditingText('');
    };

    const saveEdit = async (itemId) => {
        const text = (editingText || '').trim();
        if (!text) return;

        try {
            await axiosClient.put(`/groups/sections/items/${itemId}`, { text });
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, text } : i));
            cancelEdit();
        } catch (error) {
            console.error("Failed to update item", error);
        }
    };

    const handleDisplayModeChange = async (mode) => {
        if (!mode || mode === displayMode) return;

        const prev = displayMode;
        setDisplayMode(mode);

        try {
            await axiosClient.patch(`/groups/sections/${sectionId}/display-mode`, {
                listDisplayMode: mode,
            });
        } catch (error) {
            console.error("Failed to update display mode", error);
            setDisplayMode(prev);
        }
    };

    const activeItems = items.filter(i => !i.completed);
    const completedItems = items.filter(i => i.completed);
    const totalCount = items.length;

    // For CHECKBOX-STATIC mode, keep original order
    const staticItems = items;

    return (
        <div className="h-full flex flex-col p-0 sm:p-4">
            <div className="w-full h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Checklist</h2>
                        <p className="text-xs text-gray-500 mt-1">Capture tasks and tick them off. Completed items glide down automatically.</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-gray-600">
                            <span className="text-gray-500">View as:</span>
                            <button
                                type="button"
                                onClick={() => handleDisplayModeChange('CHECKBOX')}
                                className={`px-2 py-1 rounded-full border ${displayMode === 'CHECKBOX'
                                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                            >
                                Checklist (auto-sort)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDisplayModeChange('CHECKBOX-STATIC')}
                                className={`px-2 py-1 rounded-full border ${displayMode === 'CHECKBOX-STATIC'
                                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                            >
                                Checklist (keep order)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDisplayModeChange('UNORDERED')}
                                className={`px-2 py-1 rounded-full border ${displayMode === 'UNORDERED'
                                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                            >
                                Bullets
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDisplayModeChange('ORDERED')}
                                className={`px-2 py-1 rounded-full border ${displayMode === 'ORDERED'
                                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600'
                                    }`}
                            >
                                Numbered
                            </button>
                        </div>
                    </div>
                    {totalCount > 0 && (
                        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-1 text-[10px] text-gray-500">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{activeItems.length} open</span>
                            </div>
                            {completedItems.length > 0 && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    <span>{completedItems.length} done</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add a task, e.g. 'Share agenda with group'"
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                        disabled={isAdding}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium shadow-sm transition disabled:opacity-60"
                        disabled={!newItemText.trim() || isAdding}
                    >
                        {isAdding ? 'Adding...' : 'Add'}
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {displayMode === 'CHECKBOX' ? (
                        <div>
                            {activeItems.length > 0 && (
                                <p className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">To do</p>
                            )}
                            <ul className="space-y-2">
                                {activeItems.map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => startEdit(item)}
                                        className="px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition group cursor-text"
                                    >
                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleItem(item)}
                                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                    disabled={editingItemId === item.id}
                                                />
                                                {editingItemId === item.id ? (
                                                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="w-full bg-transparent text-sm outline-none focus:ring-0 focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    saveEdit(item.id);
                                                                }
                                                                if (e.key === 'Escape') {
                                                                    e.preventDefault();
                                                                    cancelEdit();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-sm text-gray-800 whitespace-normal break-words md:truncate md:whitespace-nowrap flex-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEdit(item);
                                                        }}
                                                    >
                                                        {item.text}
                                                    </span>
                                                )}
                                            </div>
                                            {editingItemId === item.id ? (
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveEdit(item.id)}
                                                        className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteItemId(item.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm"
                                                    type="button"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {activeItems.length === 0 && completedItems.length === 0 && (
                                    <li className="text-xs text-gray-400">No items yet. Add your first task above.</li>
                                )}
                            </ul>
                        </div>
                    ) : null}

                    {displayMode === 'CHECKBOX-STATIC' && (
                        <ul className="space-y-2">
                            {staticItems.length === 0 && (
                                <li className="text-xs text-gray-400">No items yet. Add your first task above.</li>
                            )}
                            {staticItems.map(item => (
                                <li
                                    key={item.id}
                                    onClick={() => startEdit(item)}
                                    className={`px-3 py-2.5 rounded-lg border border-gray-100 ${item.completed ? 'bg-white/60' : 'bg-gray-50'} hover:bg-white hover:border-blue-100 hover:shadow-sm transition group cursor-text`}
                                >
                                    <div className="flex items-center justify-between gap-3 min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => toggleItem(item)}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                disabled={editingItemId === item.id}
                                            />
                                            {editingItemId === item.id ? (
                                                <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="w-full bg-transparent text-sm outline-none focus:ring-0 focus:outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                saveEdit(item.id);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                e.preventDefault();
                                                                cancelEdit();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'} whitespace-normal break-words md:truncate md:whitespace-nowrap flex-1`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEdit(item);
                                                    }}
                                                >
                                                    {item.text}
                                                </span>
                                            )}
                                        </div>
                                        {editingItemId === item.id ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => saveEdit(item.id)}
                                                    className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteItemId(item.id);
                                                }}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm"
                                                type="button"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {displayMode === 'CHECKBOX' && completedItems.length > 0 && (
                        <div>
                            <p className="mt-2 text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Completed</p>
                            <ul className="space-y-2">
                                {completedItems.map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => startEdit(item)}
                                        className="px-3 py-2.5 rounded-lg border border-gray-100 bg-white/60 group hover:bg-white cursor-text"
                                    >
                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleItem(item)}
                                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                    disabled={editingItemId === item.id}
                                                />
                                                {editingItemId === item.id ? (
                                                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="w-full bg-transparent text-sm outline-none focus:ring-0 focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    saveEdit(item.id);
                                                                }
                                                                if (e.key === 'Escape') {
                                                                    e.preventDefault();
                                                                    cancelEdit();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-sm line-through text-gray-400 whitespace-normal break-words md:truncate md:whitespace-nowrap flex-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEdit(item);
                                                        }}
                                                    >
                                                        {item.text}
                                                    </span>
                                                )}
                                            </div>
                                            {editingItemId === item.id ? (
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveEdit(item.id)}
                                                        className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteItemId(item.id);
                                                    }}
                                                    className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm"
                                                    type="button"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {displayMode !== 'CHECKBOX' && displayMode !== 'CHECKBOX-STATIC' && items.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Items</p>
                            {displayMode === 'ORDERED' ? (
                                <ol className="space-y-2">
                                    {items.map((item, index) => (
                                        <li
                                            key={item.id}
                                            onClick={() => startEdit(item)}
                                            className="px-1 py-1.5 rounded-md hover:bg-gray-50 group cursor-text"
                                        >
                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <span className="text-xs text-gray-400 mt-0.5 shrink-0">{index + 1}.</span>
                                                    {editingItemId === item.id ? (
                                                        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editingText}
                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                className="w-full bg-transparent text-sm outline-none focus:ring-0 focus:outline-none"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        saveEdit(item.id);
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        e.preventDefault();
                                                                        cancelEdit();
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`text-left text-sm whitespace-normal break-words md:truncate md:whitespace-nowrap flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}
                                                        >
                                                            {item.text}
                                                        </span>
                                                    )}
                                                </div>
                                                {editingItemId === item.id ? (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit(item.id)}
                                                            className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteItemId(item.id);
                                                        }}
                                                        className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm"
                                                        type="button"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <ul className="space-y-2">
                                    {items.map(item => (
                                        <li
                                            key={item.id}
                                            onClick={() => startEdit(item)}
                                            className="px-1 py-1.5 rounded-md hover:bg-gray-50 group cursor-text"
                                        >
                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <span className="text-xs text-gray-400 mt-0.5 shrink-0">•</span>
                                                    {editingItemId === item.id ? (
                                                        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editingText}
                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                className="w-full bg-transparent text-sm outline-none focus:ring-0 focus:outline-none"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        saveEdit(item.id);
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        e.preventDefault();
                                                                        cancelEdit();
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`text-left text-sm whitespace-normal break-words md:truncate md:whitespace-nowrap flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}
                                                        >
                                                            {item.text}
                                                        </span>
                                                    )}
                                                </div>
                                                {editingItemId === item.id ? (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit(item.id)}
                                                            className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteItemId(item.id);
                                                        }}
                                                        className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm"
                                                        type="button"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {deleteItemId && (
                <ConfirmModal
                    title="Delete item?"
                    message="Are you sure you want to delete this checklist item?"
                    confirmLabel="Delete"
                    onCancel={() => setDeleteItemId(null)}
                    onConfirm={async () => {
                        const id = deleteItemId;
                        setDeleteItemId(null);
                        await deleteItem(id);
                    }}
                />
            )}
        </div>
    );
};

export default ListView;
