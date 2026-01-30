import React from 'react';
import { useParams } from 'react-router-dom';
import BentoGrid from '../BentoGrid';
import { useSectionPreviews } from '../../hooks/useSectionPreviews';

const FolderView = ({ sectionId, allSections, onOpenCreateModal }) => {
    const { groupId } = useParams();

    // Filter sections that have this folder as their parent
    const childSections = allSections.filter(s => s.parentId === sectionId);

    // Load previews for these children
    const previews = useSectionPreviews(childSections);

    if (childSections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-sm h-64">
                <p className="text-gray-400 mb-4">This folder is empty</p>
                <button
                    onClick={() => onOpenCreateModal(sectionId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    + Create Item Inside
                </button>
            </div>
        );
    }

    return (
        <div className='p-4'>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Folder Contents</h2>
                <button
                    onClick={() => onOpenCreateModal(sectionId)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm font-medium"
                >
                    + Add New
                </button>
            </div>

            <BentoGrid
                sections={childSections}
                previews={previews}
                allSections={allSections}
                groupId={groupId}
            />
        </div>
    );
};

export default FolderView;
