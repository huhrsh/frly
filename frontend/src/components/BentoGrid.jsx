import React from 'react';
import { useNavigate } from 'react-router-dom';

const BentoGrid = ({ sections, previews, allSections, groupId }) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map(section => {
                // For Folders, calculate children from the *full* list if available
                const childrenCount = allSections
                    ? allSections.filter(s => s.parentId === section.id).length
                    : 0;

                const typeLabel = section.type === 'NOTE' ? 'Notes'
                    : section.type === 'LIST' ? 'Lists'
                        : section.type === 'GALLERY' ? 'Files'
                            : section.type === 'REMINDER' ? 'Reminders'
                                : section.type === 'PAYMENT' ? 'Payments'
                                    : 'Folder';

                const typeBadgeClass = section.type === 'NOTE' ? 'bg-blue-50 text-blue-700'
                    : section.type === 'LIST' ? 'bg-emerald-50 text-emerald-700'
                        : section.type === 'GALLERY' ? 'bg-rose-50 text-rose-700'
                            : section.type === 'REMINDER' ? 'bg-amber-50 text-amber-700'
                                : section.type === 'PAYMENT' ? 'bg-purple-50 text-purple-700'
                                    : 'bg-gray-100 text-gray-700';

                const preview = previews[section.id];

                return (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => navigate(`/groups/${groupId}/sections/${section.id}`)}
                        className="text-left bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition p-4 flex flex-col justify-between min-h-[120px] group"
                    >
                        <div className="flex items-start justify-between mb-2 w-full">
                            <h3 className="text-sm font-semibold text-gray-900 truncate mr-2 w-full">
                                {section.title}
                            </h3>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${typeBadgeClass}`}>
                                {typeLabel}
                            </span>
                        </div>

                        <div className="mt-1 text-[11px] text-gray-500 flex-1 min-h-[40px] w-full">
                            {!preview && section.type !== 'FOLDER' ? (
                                <span className="text-gray-400">Loading...</span>
                            ) : preview?.kind === 'NOTE' ? (
                                <div className="space-y-1">
                                    <p className="text-[11px] text-gray-600 leading-snug max-h-16 overflow-hidden line-clamp-3 break-words">
                                        {preview.snippet || 'Empty note'}
                                    </p>
                                    {(preview.lastEditedAt || preview.lastEditedByName) && (
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-2">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                                                <span className="mr-1">✏️</span>
                                                <span>
                                                    {preview.lastEditedByName || 'Someone'}
                                                </span>
                                            </span>
                                        </p>
                                    )}
                                </div>
                            ) : preview?.kind === 'LIST' ? (
                                <ul className="space-y-0.5 max-h-16 overflow-hidden">
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
                                <ul className="space-y-1 max-h-16 overflow-hidden">
                                    {preview.reminders?.length ? preview.reminders.map((r, idx) => (
                                        <li key={idx} className={`flex items-center justify-between text-[10px] ${r.isSent ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-1 truncate">
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.isSent ? 'bg-gray-400' : 'bg-amber-500'}`}></span>
                                                <span className={`truncate font-medium ${r.isSent ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{r.title}</span>
                                            </div>
                                            {r.triggerTime && !r.isSent && (
                                                <span className="text-gray-400 text-[9px] whitespace-nowrap ml-1">
                                                    {new Date(r.triggerTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </li>
                                    )) : (
                                        <li className="text-gray-400">No active reminders</li>
                                    )}
                                </ul>
                            ) : preview?.kind === 'GALLERY' ? (
                                <div className="space-y-2">
                                    <div className="flex gap-1 overflow-hidden h-10">
                                        {preview.images?.length > 0 ? preview.images.map((img, idx) => (
                                            img.type?.startsWith('image/') ? (
                                                <img key={idx} src={img.url} alt="" className="h-10 w-10 object-cover rounded-md border border-gray-100" />
                                            ) : (
                                                <div key={idx} className="h-10 w-10 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-[9px]">FILE</div>
                                            )
                                        )) : (
                                            <span className="text-gray-400 flex items-center h-full">No files</span>
                                        )}
                                    </div>
                                    {preview.totalCount > 0 && (
                                        <p className="text-[10px] text-gray-500">{preview.totalCount} file{preview.totalCount !== 1 ? 's' : ''}</p>
                                    )}
                                </div>
                            ) : preview?.kind === 'PAYMENT' ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">Your Balance:</p>
                                    <p className={`text-lg font-bold ${preview.balance > 0 ? 'text-emerald-600' : preview.balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {preview.balance > 0 ? '+' : ''}{preview.balance.toFixed(2)}
                                    </p>
                                </div>
                            ) : (
                                // Folder
                                <div className="text-gray-500">
                                    {childrenCount > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{childrenCount}</span>
                                                <span>items inside</span>
                                            </div>
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {allSections && allSections
                                                    .filter(s => s.parentId === section.id)
                                                    .slice(0, 3)
                                                    .map(child => (
                                                        <span key={child.id} className="text-[9px] bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-500 truncate max-w-[80px]">
                                                            {child.title}
                                                        </span>
                                                    ))}
                                                {childrenCount > 3 && <span className="text-[9px] text-gray-400 self-center">+ more</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Empty folder</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default BentoGrid;
