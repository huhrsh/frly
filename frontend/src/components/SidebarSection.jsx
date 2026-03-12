import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const SidebarSection = ({ section, allSections, selectedSection, onSelect, depth = 0 }) => {
    // Find children of this section
    const children = allSections.filter(s => s.parentId === section.id);
    const hasChildren = children.length > 0;

    const [isExpanded, setIsExpanded] = useState(false);

    const isSelected = selectedSection?.id === section.id;
    const isFolder = section.type === 'FOLDER';

    const isAncestorOfSelected = () => {
        if (!selectedSection || !selectedSection.parentId) return false;
        let current = allSections.find(s => s.id === selectedSection.parentId);
        while (current) {
            if (current.id === section.id) return true;
            if (!current.parentId) break;
            current = allSections.find(s => s.id === current.parentId);
        }
        return false;
    };

    let typeClasses;
    let typeLabelClasses;
    let indicatorClasses;
    switch (section.type) {
        case 'NOTE':
            typeClasses = isSelected
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800';
            typeLabelClasses = isSelected ? 'text-blue-700' : 'text-blue-500';
            indicatorClasses = 'border-blue-400';
            break;
        case 'LIST':
            typeClasses = isSelected
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800';
            typeLabelClasses = isSelected ? 'text-emerald-700' : 'text-emerald-500';
            indicatorClasses = 'border-emerald-400';
            break;
        case 'LINKS':
            typeClasses = isSelected
                ? 'bg-sky-50 text-sky-700 shadow-sm'
                : 'text-gray-700 hover:bg-sky-50 hover:text-sky-800';
            typeLabelClasses = isSelected ? 'text-sky-700' : 'text-sky-500';
            indicatorClasses = 'border-sky-400';
            break;
        case 'GALLERY':
            typeClasses = isSelected
                ? 'bg-rose-50 text-rose-700 shadow-sm'
                : 'text-gray-700 hover:bg-rose-50 hover:text-rose-800';
            typeLabelClasses = isSelected ? 'text-rose-700' : 'text-rose-500';
            indicatorClasses = 'border-rose-400';
            break;
        case 'REMINDER':
            typeClasses = isSelected
                ? 'bg-amber-50 text-amber-700 shadow-sm'
                : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800';
            typeLabelClasses = isSelected ? 'text-amber-700' : 'text-amber-500';
            indicatorClasses = 'border-amber-400';
            break;
        case 'PAYMENT':
            typeClasses = isSelected
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-800';
            typeLabelClasses = isSelected ? 'text-indigo-700' : 'text-indigo-500';
            indicatorClasses = 'border-indigo-400';
            break;
        case 'CALENDAR':
            typeClasses = isSelected
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-800';
            typeLabelClasses = isSelected ? 'text-indigo-700' : 'text-indigo-500';
            indicatorClasses = 'border-indigo-400';
            break;
        case 'FOLDER':
            typeClasses = isSelected
                ? 'bg-slate-50 text-slate-800 shadow-sm'
                : 'text-gray-700 hover:bg-slate-50 hover:text-slate-900';
            typeLabelClasses = isSelected ? 'text-slate-800' : 'text-slate-500';
            indicatorClasses = 'border-slate-400';
            break;
        default:
            typeClasses = isSelected
                ? 'bg-gray-50 text-gray-800 shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900';
            typeLabelClasses = isSelected ? 'text-gray-800' : 'text-gray-500';
            indicatorClasses = 'border-gray-300';
    }

    useEffect(() => {
        if (!isFolder) return;
        const shouldBeExpanded = isSelected || isAncestorOfSelected();
        if (shouldBeExpanded !== isExpanded) {
            setIsExpanded(shouldBeExpanded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSection, allSections, isFolder, isSelected]);

    const handleClick = () => {
        onSelect(section);
        if (isFolder) {
            setIsExpanded(prev => !prev);
        }
    };

    return (
        <div className="my-1">
            <div
                className={`group flex items-center justify-between px-2 py-2 cursor-pointer text-sm font-medium transition-all duration-200 rounded-r-md border-l-4 ${indicatorClasses} ${typeClasses}`}
                style={{ marginLeft: depth * 12 }}
                onClick={handleClick}
            >

                <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate pl-1">{section.title}</span>
                </div>

                {section.type === 'FOLDER' ? (
                    <button
                        type="button"
                        className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/60"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <ChevronRight size={14} className={isExpanded ? 'transform rotate-90 transition-transform' : 'transition-transform'} />
                    </button>
                ) : (
                    <span className={`ml-2 text-[10px] uppercase tracking-wide flex-shrink-0 ${typeLabelClasses}`}>
                        {section.type === 'NOTE' && 'Note'}
                        {section.type === 'LIST' && 'Checklist'}
                        {section.type === 'LINKS' && 'Links'}
                        {section.type === 'GALLERY' && 'Files'}
                        {section.type === 'REMINDER' && 'Reminders'}
                        {section.type === 'PAYMENT' && 'Payments'}
                        {section.type === 'CALENDAR' && 'Calendar'}
                    </span>
                )}
            </div>

            {/* Recursive Children */}
            {isExpanded && hasChildren && (
                <div>
                    {children.map(child => (
                        <SidebarSection
                            key={child.id}
                            section={child}
                            allSections={allSections}
                            selectedSection={selectedSection}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SidebarSection;
