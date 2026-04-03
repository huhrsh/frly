import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, GripVertical } from 'lucide-react';

const getTypeMeta = (type) => {
    if (!type) {
        return {
            label: '',
            badgeClass: 'bg-gray-100 text-gray-600',
        };
    }

    switch (type) {
        case 'NOTE':
            return {
                label: 'Note',
                badgeClass: 'bg-blue-50 text-blue-700',
            };
        case 'LIST':
            return {
                label: 'Checklist',
                badgeClass: 'bg-emerald-50 text-emerald-700',
            };
        case 'LINKS':
            return {
                label: 'Links',
                badgeClass: 'bg-sky-50 text-sky-700',
            };
        case 'GALLERY':
            return {
                label: 'Files',
                badgeClass: 'bg-rose-50 text-rose-700',
            };
        case 'REMINDER':
            return {
                label: 'Reminders',
                badgeClass: 'bg-amber-50 text-amber-700',
            };
        case 'PAYMENT':
            return {
                label: 'Expenses',
                badgeClass: 'bg-purple-50 text-purple-700',
            };
        case 'CALENDAR':
            return {
                label: 'Calendar',
                badgeClass: 'bg-indigo-50 text-indigo-700',
            };
        case 'FOLDER':
            return {
                label: 'Folder',
                badgeClass: 'bg-slate-50 text-slate-700',
            };
        default:
            return {
                label: type,
                badgeClass: 'bg-gray-100 text-gray-600',
            };
    }
};

const ReorderSectionsModal = ({
    open,
    title = 'Reorder items',
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
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        setLocalItems((prev) => {
            const updated = Array.from(prev);
            const [moved] = updated.splice(source.index, 1);
            if (!moved) return prev;
            updated.splice(destination.index, 0, moved);
            return updated;
        });
    };

    const handleSave = async () => {
        if (onSave) {
            const orderedIds = localItems.map((item) => item.id);
            await onSave(orderedIds);
        }
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="px-4 py-3 text-xs text-gray-500 border-b border-gray-100 bg-gray-50/70">
                    Drag items using the handle to change their order. This order is personal — only you will see it.
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="reorder-list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="max-h-96 overflow-y-auto px-3 py-3 space-y-1 bg-white"
                            >
                                {localItems.length === 0 && (
                                    <div className="px-3 py-4 text-center text-xs text-gray-400">
                                        No items to reorder.
                                    </div>
                                )}
                                {localItems.map((item, index) => (
                                    <Draggable
                                        key={item.id}
                                        draggableId={String(item.id)}
                                        index={index}
                                    >
                                        {(dragProvided, snapshot) => (
                                            (() => {
                                                const { label, badgeClass } = getTypeMeta(item.type);
                                                return (
                                            <div
                                                ref={dragProvided.innerRef}
                                                {...dragProvided.draggableProps}
                                                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${snapshot.isDragging ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'} transition-colors`}
                                            >
                                                <button
                                                    type="button"
                                                    {...dragProvided.dragHandleProps}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
                                                    aria-label="Drag to reorder"
                                                >
                                                    <GripVertical size={14} />
                                                </button>
                                                <div className="flex items-center justify-between w-full min-w-0">
                                                    <p className="truncate text-gray-900 text-xs font-medium">{item.title}</p>
                                                    {label && (
                                                        <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                                                            {label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                                );
                                            })()
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/80">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                        Save order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReorderSectionsModal;
