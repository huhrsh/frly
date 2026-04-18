import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, GripVertical } from 'lucide-react';

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

const ReorderSectionsModal = ({
    open,
    title = 'Reorder sections',
    items,
    onClose,
    onSave,
}) => {
    const [localItems, setLocalItems] = useState([]);

    useEffect(() => {
        if (open) {
            setLocalItems(Array.isArray(items) ? items : []);
        }
    }, [open, items]);

    if (!open) return null;

    const handleDragEnd = (result) => {
        const { source, destination } = result || {};
        if (!destination || !source) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        setLocalItems((prev) => {
            const updated = Array.from(prev);
            const [moved] = updated.splice(source.index, 1);
            if (!moved) return prev;
            updated.splice(destination.index, 0, moved);
            return updated;
        });
    };

    const handleSave = async () => {
        if (onSave) await onSave(localItems.map((item) => item.id));
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Drag to reorder — this order is personal to you.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* List */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="reorder-list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="overflow-y-auto px-4 py-3 space-y-1.5 flex-1 min-h-0"
                            >
                                {localItems.length === 0 && (
                                    <div className="py-8 text-center text-xs text-gray-400">
                                        No items to reorder.
                                    </div>
                                )}
                                {localItems.map((item, index) => {
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

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
                    <span className="text-[11px] text-gray-400">{localItems.length} section{localItems.length !== 1 ? 's' : ''}</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            Save order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderSectionsModal;
