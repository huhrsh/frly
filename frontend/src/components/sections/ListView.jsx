import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const ListView = ({ sectionId }) => {
    const [items, setItems] = useState([]);
    const [newItemText, setNewItemText] = useState('');

    useEffect(() => {
        fetchItems();
    }, [sectionId]);

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
        if (!newItemText.trim()) return;

        try {
            await axiosClient.post(`/groups/sections/${sectionId}/items`, {
                text: newItemText,
                sectionId
            });
            setNewItemText('');
            fetchItems();
        } catch (error) {
            console.error("Failed to add item", error);
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

    const activeItems = items.filter(i => !i.completed);
    const completedItems = items.filter(i => i.completed);
    const totalCount = items.length;

    return (
        <div className="h-full flex flex-col p-0 sm:p-4">
            <div className="w-full h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Checklist</h2>
                        <p className="text-xs text-gray-500 mt-1">Capture tasks and tick them off. Completed items glide down automatically.</p>
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
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium shadow-sm transition disabled:opacity-60"
                        disabled={!newItemText.trim()}
                    >
                        Add
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-4">
                    <div>
                        {activeItems.length > 0 && (
                            <p className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">To do</p>
                        )}
                        <ul className="space-y-2">
                            {activeItems.map(item => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleItem(item)}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-800 whitespace-normal break-words md:truncate md:whitespace-nowrap">
                                            {item.text}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                            {activeItems.length === 0 && completedItems.length === 0 && (
                                <li className="text-xs text-gray-400">No items yet. Add your first task above.</li>
                            )}
                        </ul>
                    </div>

                    {completedItems.length > 0 && (
                        <div>
                            <p className="mt-2 text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Completed</p>
                            <ul className="space-y-2">
                                {completedItems.map(item => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-white/60 group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={() => toggleItem(item)}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-sm line-through text-gray-400 whitespace-normal break-words md:truncate md:whitespace-nowrap">
                                                {item.text}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListView;
