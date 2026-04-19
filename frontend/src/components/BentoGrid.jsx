import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseUTCDate } from '../utils/dateUtils';

const BentoGrid = ({ sections, previews, allSections, groupId, onOpenCreateModal }) => {
    const navigate = useNavigate();

    const handleCardClick = (sectionId) => {
        navigate(`/groups/${groupId}/sections/${sectionId}?from=BENTO`);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 min-h-[120px]">
            {sections.map((section) => {
                // For Folders, calculate children from the *full* list if available
                const childrenCount = allSections
                    ? allSections.filter(s => s.parentId === section.id).length
                    : 0;

                const typeLabel = section.type === 'NOTE' ? 'Note'
                    : section.type === 'LIST' ? 'Checklist'
                        : section.type === 'LINKS' ? 'Links'
                            : section.type === 'GALLERY' ? 'Files'
                                : section.type === 'REMINDER' ? 'Reminder'
                                    : section.type === 'PAYMENT' ? 'Expenses'
                                        : section.type === 'CALENDAR' ? 'Calendar'
                                            : 'Folder';

                const typeBadgeClass = section.type === 'NOTE' ? 'bg-blue-50 text-blue-700'
                    : section.type === 'LIST' ? 'bg-emerald-50 text-emerald-700'
                        : section.type === 'LINKS' ? 'bg-sky-50 text-sky-700'
                            : section.type === 'GALLERY' ? 'bg-rose-50 text-rose-700'
                                : section.type === 'REMINDER' ? 'bg-amber-50 text-amber-700'
                                    : section.type === 'PAYMENT' ? 'bg-purple-50 text-purple-700'
                                        : section.type === 'CALENDAR' ? 'bg-indigo-50 text-indigo-700'
                                            : 'bg-gray-100 text-gray-700';

                const preview = previews[section.id];

                const isFolder = section.type === 'FOLDER';

                return (
                    <div
                        key={section.id}
                        onClick={() => handleCardClick(section.id)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md flex flex-col h-[130px] group cursor-pointer p-4 transition-all duration-200 overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-2 w-full">
                            <h3 className="text-sm font-semibold text-gray-900 truncate mr-2 w-full">
                                {section.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
                                    {typeLabel}
                                </span>
                                {isFolder && onOpenCreateModal && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenCreateModal(section.id);
                                        }}
                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                    >
                                        + Inside
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-1 text-xs text-gray-500 flex-1 w-full overflow-hidden">
                            {!preview && section.type !== 'FOLDER' ? (
                                <span className="text-gray-400">Loading...</span>
                            ) : preview?.kind === 'NOTE' ? (
                                <div className="flex flex-col justify-between h-full">
                                    <p className="text-xs text-gray-600 leading-snug line-clamp-2 break-words">
                                        {preview.snippet || 'Empty note'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                                        Last edited by {preview.lastEditedByName || 'Someone'}
                                        {preview.lastEditedAt && (
                                            <span className="ml-1">· {parseUTCDate(preview.lastEditedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        )}
                                    </p>
                                </div>
                            ) : preview?.kind === 'LIST' ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[11px] font-medium flex-wrap">
                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                            {preview.openCount ?? 0} open
                                        </span>
                                        {(preview.completedCount ?? 0) > 0 && (
                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {preview.completedCount} done
                                            </span>
                                        )}
                                    </div>
                                    {(preview.openCount ?? 0) === 0 ? (
                                        <p className="text-xs text-gray-400">All done!</p>
                                    ) : (
                                        <ul className="space-y-0.5 mt-0.5">
                                            {(preview.items || []).map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-1 text-xs text-gray-600 truncate">
                                                    <span className="text-gray-400 shrink-0">•</span>
                                                    <span className="truncate">{item.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : preview?.kind === 'LINKS' ? (
                                <p className="text-xs text-gray-500">
                                    {typeof preview.count === 'number' && preview.count > 0
                                        ? `${preview.count} link${preview.count === 1 ? '' : 's'}`
                                        : 'No links yet'}
                                </p>
                            ) : preview?.kind === 'REMINDER' ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-medium">
                                        <span className={`px-2 py-0.5 rounded-full ${(preview.activeCount ?? 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {preview.activeCount ?? 0} active
                                        </span>
                                        {(preview.totalCount ?? 0) > (preview.activeCount ?? 0) && (
                                            <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                                                {(preview.totalCount ?? 0) - (preview.activeCount ?? 0)} sent
                                            </span>
                                        )}
                                    </div>
                                    {preview.next && (
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <div className="flex items-center gap-1 truncate">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                <span className="truncate font-medium">{preview.next.title}</span>
                                            </div>
                                            {preview.next.triggerTime && (
                                                <span className="text-gray-400 text-[10px] whitespace-nowrap ml-1">
                                                    {parseUTCDate(preview.next.triggerTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {(preview.activeCount ?? 0) === 0 && (
                                        <p className="text-xs text-gray-400">No active reminders</p>
                                    )}
                                </div>
                            ) : preview?.kind === 'GALLERY' ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">
                                        {typeof preview.totalCount === 'number' && preview.totalCount > 0
                                            ? `${preview.totalCount} file${preview.totalCount !== 1 ? 's' : ''} stored`
                                            : 'No files yet'}
                                    </p>
                                    {/* <p className="text-[10px] text-gray-400">Open to browse and upload files.</p> */}
                                </div>
                            ) : preview?.kind === 'PAYMENT' ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] text-gray-400">Total spent</p>
                                            <p className="text-base font-bold text-gray-800">₹{preview.totalSpent?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        {preview.balance !== undefined && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400">My balance</p>
                                                <p className={`text-sm font-semibold ${preview.balance > 0 ? 'text-emerald-600' : preview.balance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                    {preview.balance > 0 ? '+' : ''}₹{Math.abs(preview.balance || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : preview?.kind === 'CALENDAR' ? (
                                <div className="flex flex-col gap-1">
                                    {preview.todayEvents && preview.todayEvents.length > 0 ? (
                                        <ul className="space-y-0.5">
                                            {preview.todayEvents.slice(0, 2).map((ev, idx) => (
                                                <li key={idx} className="flex items-center justify-between text-xs">
                                                    <span className="truncate text-gray-700">{ev.title}</span>
                                                    {ev.startTime && (
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1">
                                                            {new Date(ev.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                            {preview.todayEvents.length > 2 && (
                                                <li className="text-[10px] text-gray-400">+{preview.todayEvents.length - 2} more today</li>
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-400">No events today</p>
                                    )}
                                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                        {(preview.todayCount ?? (preview.todayEvents?.length || 0)) > 0 && (
                                            <span>
                                                Today: {preview.todayCount ?? preview.todayEvents.length}
                                            </span>
                                        )}
                                        {(preview.upcomingCount ?? 0) > 0 && (
                                            <span>
                                                Upcoming: {preview.upcomingCount}
                                            </span>
                                        )}
                                        {(preview.pastCount ?? 0) > 0 && (
                                            <span>
                                                Past: {preview.pastCount}
                                            </span>
                                        )}
                                        {(!preview.totalCount || preview.totalCount === 0) && (
                                            <span>No events yet</span>
                                        )}
                                    </div>
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
                                                    .map(child => {
                                                        // Bold color coding based on child type
                                                        const childBgClass = child.type === 'NOTE' ? 'bg-blue-100 border-blue-200 text-blue-700'
                                                            : child.type === 'LIST' ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                                            : child.type === 'GALLERY' ? 'bg-rose-100 border-rose-200 text-rose-700'
                                                            : child.type === 'REMINDER' ? 'bg-amber-100 border-amber-200 text-amber-700'
                                                            : child.type === 'PAYMENT' ? 'bg-purple-100 border-purple-200 text-purple-700'
                                                            : child.type === 'CALENDAR' ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                                                            : 'bg-gray-100 border-gray-200 text-gray-700';
                                                        return (
                                                            <span key={child.id} className={`text-[10px] ${childBgClass} border px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]`}>
                                                                {child.title}
                                                            </span>
                                                        );
                                                    })}
                                                {childrenCount > 3 && <span className="text-[10px] text-gray-400 self-center">+ more</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Empty folder</span>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
    );
};

export default BentoGrid;

