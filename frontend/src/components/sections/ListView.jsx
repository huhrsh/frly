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

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Checklist</h2>
            <p className="text-xs text-gray-500 mb-4">Capture tasks and tick them off. Completed items move to the bottom automatically.</p>

            <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add new item..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">Add</button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-4">
                <div>
                    {activeItems.length > 0 && (
                        <p className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">To do</p>
                    )}
                    <ul className="space-y-2">
                        {activeItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={() => toggleItem(item)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-800">
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
                        <ul className="space-y-1.5">
                            {completedItems.map(item => (
                                <li key={item.id} className="flex items-center justify-between px-2 py-1.5 rounded group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleItem(item)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-xs line-through text-gray-400">
                                            {item.text}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-xs"
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
    );
};

export default ListView;
