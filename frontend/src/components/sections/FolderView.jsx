import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSectionPreviews } from '../../hooks/useSectionPreviews';

const FolderView = ({ sectionId, allSections, onOpenCreateModal, onSelectSection }) => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    // Filter sections that have this folder as their parent
    const childSections = allSections.filter(s => s.parentId === sectionId);

    // Load previews for these children (notes, lists, reminders, etc.)
    const previews = useSectionPreviews(childSections);

    if (childSections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-sm h-64">
                <p className="text-gray-400 mb-2">This folder is empty</p>
                {onOpenCreateModal && (
                    <button
                        onClick={() => onOpenCreateModal(sectionId)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                    >
                        + Create item inside
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="sm:p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Folder contents</h2>
                {onOpenCreateModal && (
                    <button
                        onClick={() => onOpenCreateModal(sectionId)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-xs font-medium"
                    >
                        + Add inside
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 min-h-[120px]">
                {childSections.map((child) => {
                    const preview = previews[child.id];

                    const typeLabel = child.type === 'NOTE' ? 'Note'
                        : child.type === 'LIST' ? 'Checklist'
                            : child.type === 'GALLERY' ? 'Files'
                                : child.type === 'REMINDER' ? 'Reminder'
                                    : child.type === 'PAYMENT' ? 'Expenses'
                                        : 'Folder';

                    const typeBadgeClass = child.type === 'NOTE' ? 'bg-blue-50 text-blue-700'
                        : child.type === 'LIST' ? 'bg-emerald-50 text-emerald-700'
                            : child.type === 'GALLERY' ? 'bg-rose-50 text-rose-700'
                                : child.type === 'REMINDER' ? 'bg-amber-50 text-amber-700'
                                    : child.type === 'PAYMENT' ? 'bg-purple-50 text-purple-700'
                                        : 'bg-gray-100 text-gray-700';

                    const childrenCount = allSections.filter(s => s.parentId === child.id).length;

                    const handleClick = () => {
                        if (onSelectSection) {
                            onSelectSection(child);
                        } else {
                            navigate(`/groups/${groupId}/sections/${child.id}`);
                        }
                    };

                    return (
                        <div
                            key={child.id}
                            onClick={handleClick}
                            className="text-left bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md p-4 flex flex-col justify-between min-h-[120px] group cursor-pointer transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-2 w-full">
                                <h3 className="text-sm font-semibold text-gray-900 truncate mr-2 w-full">
                                    {child.title}
                                </h3>
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
                                    {typeLabel}
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] text-gray-500 flex-1 min-h-[40px] w-full">
                                {!preview && child.type !== 'FOLDER' ? (
                                    <span className="text-gray-400">Loading...</span>
                                ) : preview?.kind === 'NOTE' ? (
                                    <p className="text-[10px] text-gray-600 leading-snug max-h-12 overflow-hidden line-clamp-2 break-words">
                                        {preview.snippet || 'Empty note'}
                                    </p>
                                ) : preview?.kind === 'LIST' ? (
                                    <ul className="space-y-0.5 max-h-12 overflow-hidden">
                                        {preview.items?.length ? preview.items.map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-1">
                                                <span className={`inline-block w-2 h-2 rounded-full ${item.completed ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                                <span className="truncate">{item.text}</span>
                                            </li>
                                        )) : (
                                            <li className="text-gray-400">No items yet</li>
                                        )}
                                    </ul>
                                ) : preview?.kind === 'REMINDER' ? (
                                    <ul className="space-y-1 max-h-12 overflow-hidden">
                                        {preview.reminders?.length ? preview.reminders.map((r, idx) => (
                                            <li key={idx} className={`flex items-center justify-between text-[9px] ${r.isSent ? 'opacity-50' : ''}`}>
                                                <span className={`truncate font-medium ${r.isSent ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{r.title}</span>
                                            </li>
                                        )) : (
                                            <li className="text-gray-400">No active reminders</li>
                                        )}
                                    </ul>
                                ) : preview?.kind === 'GALLERY' ? (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-gray-600">
                                            {typeof preview.totalCount === 'number' && preview.totalCount > 0
                                                ? `${preview.totalCount} file${preview.totalCount !== 1 ? 's' : ''} stored`
                                                : 'No files yet'}
                                        </p>
                                    </div>
                                ) : preview?.kind === 'PAYMENT' ? (
                                    <p className={`text-sm font-semibold ${preview.balance > 0 ? 'text-emerald-600' : preview.balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {preview.balance > 0 ? '+' : ''}{preview.balance.toFixed(2)}
                                    </p>
                                ) : (
                                    <div className="text-gray-500 flex items-center gap-2 text-[10px]">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{childrenCount}</span>
                                        <span>items inside</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FolderView;

