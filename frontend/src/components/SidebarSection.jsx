import React, { useState } from 'react';
import {
    FileText,
    ListChecks,
    Image,
    Folder,
    FolderOpen,
    Clock,
    File,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

const SidebarSection = ({ section, allSections, selectedSection, onSelect, depth = 0 }) => {
    // Find children of this section
    const children = allSections.filter(s => s.parentId === section.id);
    const hasChildren = children.length > 0;

    // Auto-expand if the selected section is a descendant of this section
    // (Simple check: if selected section has this as parent, etc. - complex to track entire ancestry without map)
    const [isExpanded, setIsExpanded] = useState(false);

    const isSelected = selectedSection?.id === section.id;
    const isFolder = section.type === 'FOLDER';

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleClick = () => {
        onSelect(section);
        if (isFolder && !isExpanded) {
            setIsExpanded(true);
        }
    };

    const getIcon = () => {
        const size = 18;
        switch (section.type) {
            case 'NOTE': return <FileText size={size} />;
            case 'LIST': return <ListChecks size={size} />;
            case 'GALLERY': return <Image size={size} />;
            case 'FOLDER': return isExpanded ? <FolderOpen size={size} /> : <Folder size={size} />;
            case 'REMINDER': return <Clock size={size} />;
            case 'PAYMENT': return <ListChecks size={size} />;
            default: return <File size={size} />;
        }
    };

    return (
        <div>
            <div
                className={`group flex items-center px-3 py-2 cursor-pointer text-sm font-medium transition-all duration-200 rounded-md mx-1 my-0.5
                    ${isSelected ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={handleClick}
            >

                {/* Arrow for folders */}
                <span
                    className={`mr-1 text-gray-400 hover:text-gray-700 w-4 h-4 flex items-center justify-center`}
                    onClick={isFolder ? handleToggle : undefined}
                >
                    {isFolder && (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    )}
                </span>

                <span className={`mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {getIcon()}
                </span>
                <span className="truncate">{section.title}</span>
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
