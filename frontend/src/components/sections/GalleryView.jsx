import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import {
    MoreVertical,
    FileText,
    Video,
    Image as ImageIcon,
    File,
    Download,
    X,
    Trash2,
    Edit2,
    UploadCloud
} from 'lucide-react';

const GalleryView = ({ sectionId }) => {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [renamingId, setRenamingId] = useState(null);
    const [renameText, setRenameText] = useState('');

    const [previewItem, setPreviewItem] = useState(null);
    const [previewText, setPreviewText] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    // Menu state: { itemId: number | null }
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchImages();
        // Close menu on click outside
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sectionId]);

    const fetchImages = async () => {
        try {
            const res = await axiosClient.get(`/groups/sections/${sectionId}/gallery`);
            setImages(res.data);
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await axiosClient.post(`/groups/sections/${sectionId}/gallery`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                successCount++;
            } catch (error) {
                console.error(`Upload failed for ${file.name}`, error);
                failCount++;
            }
        }

        if (successCount > 0) toast.success(`Uploaded ${successCount} files`);
        if (failCount > 0) toast.error(`Failed to upload ${failCount} files`);

        fetchImages();
        setUploading(false);
        e.target.value = '';
    };

    const handleDelete = async (itemId) => {
        if (!confirm("Delete this file?")) return;
        try {
            await axiosClient.delete(`/groups/sections/gallery/${itemId}`);
            setImages(images.filter(img => img.id !== itemId));
            toast.success("File deleted");
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Delete failed");
        }
    };

    const startRename = (item) => {
        setRenamingId(item.id);
        setRenameText(item.title || item.originalFilename);
        setOpenMenuId(null);
    };

    const cancelRename = () => {
        setRenamingId(null);
        setRenameText('');
    };

    const submitRename = async (itemId) => {
        if (!renameText.trim()) return;
        try {
            await axiosClient.patch(`/groups/sections/gallery/${itemId}`, {
                title: renameText
            });
            setImages(images.map(img => img.id === itemId ? { ...img, title: renameText } : img));
            setRenamingId(null);
            toast.success("Renamed successfully");
        } catch (error) {
            console.error("Rename failed", error);
            toast.error("Rename failed");
        }
    };

    const toggleMenu = (e, itemId) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(openMenuId === itemId ? null : itemId);
    };

    const getFileIcon = (contentType) => {
        const size = 48;
        const className = "text-gray-400";
        if (contentType.startsWith('image/')) return <ImageIcon size={size} className={className} />;
        if (contentType.includes('pdf')) return <FileText size={size} className="text-red-400" />;
        if (contentType.includes('text') || contentType.includes('document') || contentType.includes('sheet')) return <FileText size={size} className="text-blue-400" />;
        if (contentType.includes('video')) return <Video size={size} className={className} />;
        return <File size={size} className={className} />;
    };

    const handleDownload = async (item) => {
        if (!item?.url) return;

        try {
            // For raw files (not viewable in browser), we want to force download with correct name
            // Fetching as blob ensures we get the binary data correctly
            const response = await fetch(item.url);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Use original filename or fallback
            a.download = item.originalFilename || `download-${item.id}`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Download started");
        } catch (error) {
            console.error("Download failed", error);
            // Fallback to opening in new tab if fetch fails (e.g. CORS)
            window.open(item.url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleItemClick = (item) => {
        const type = (item.contentType || '').toLowerCase();
        const isImage = type.startsWith('image/');
        const isPdf = type.includes('pdf');
        const isVideo = type.startsWith('video/');
        const isTextLike = type.startsWith('text/') || type.includes('json') || type.includes('csv');

        if (isImage || isPdf || isVideo || isTextLike) {
            setPreviewItem(item);
            setPreviewText(null);
            setPreviewLoading(false);
            setPreviewError(null);
        } else {
            // For unsupported types (e.g. XLSX), open in a new tab
            handleDownload(item);
        }
    };

    // When previewing text-like files (JSON, CSV, plain text), fetch content for inline display
    useEffect(() => {
        if (!previewItem) return;

        const type = (previewItem.contentType || '').toLowerCase();
        const isTextLike = type.startsWith('text/') || type.includes('json') || type.includes('csv');
        if (!isTextLike) {
            setPreviewText(null);
            setPreviewLoading(false);
            setPreviewError(null);
            return;
        }

        let cancelled = false;
        const loadText = async () => {
            try {
                setPreviewLoading(true);
                setPreviewError(null);
                const res = await fetch(previewItem.url);
                const raw = await res.text();
                if (cancelled) return;

                // Pretty-print JSON if applicable
                if (type.includes('json')) {
                    try {
                        const parsed = JSON.parse(raw);
                        setPreviewText(JSON.stringify(parsed, null, 2));
                    } catch {
                        setPreviewText(raw);
                    }
                } else {
                    setPreviewText(raw);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load preview text', err);
                    setPreviewError('Could not load file contents for preview.');
                }
            } finally {
                if (!cancelled) {
                    setPreviewLoading(false);
                }
            }
        };

        loadText();
        return () => {
            cancelled = true;
        };
    }, [previewItem]);

    return (
        <div className="p-4" onClick={() => setOpenMenuId(null)}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Gallery & Files</h2>
                <div className="relative">
                    <input
                        type="file"
                        id="gallery-upload"
                        className="hidden"
                        onChange={handleUpload}
                        multiple
                        disabled={uploading}
                    />
                    <label
                        htmlFor="gallery-upload"
                        className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadCloud size={18} /> Upload Files
                            </>
                        )}
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(img => (
                    <div
                        key={img.id}
                        className="group relative bg-white border rounded-lg shadow-sm hover:shadow-md transition flex flex-col cursor-pointer"

                    >
                        {/* Preview Area */}
                        <div
                            className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden relative rounded-t-lg"
                            onClick={() => handleItemClick(img)}
                        >
                            {img.contentType.startsWith('image/') ? (
                                <img
                                    src={img.url}
                                    alt={img.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    {getFileIcon(img.contentType)}
                                    <span className="text-[10px] mt-2 font-mono uppercase bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                        {img.contentType.split('/')[1]?.split('+')[0] || 'FILE'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info / Actions */}
                        <div className="p-3 bg-white flex-1 flex flex-col justify-between border-t relative rounded-b-lg">
                            {renamingId === img.id ? (
                                <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={renameText}
                                        onChange={(e) => setRenameText(e.target.value)}
                                        className="w-full border rounded px-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') submitRename(img.id);
                                            if (e.key === 'Escape') cancelRename();
                                        }}
                                    />
                                    <button onClick={() => submitRename(img.id)} className="text-green-600 hover:text-green-700 p-1"><Edit2 size={14} /></button>
                                    <button onClick={cancelRename} className="text-red-600 hover:text-red-700 p-1">✕</button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1" onClick={() => handleItemClick(img)}>
                                        <h3 className="text-sm font-medium text-gray-800 truncate" title={img.title}>
                                            {img.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {(img.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                    </div>

                                    {/* 3-Dot Menu Trigger */}
                                    <button
                                        onClick={(e) => toggleMenu(e, img.id)}
                                        className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenuId === img.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-2 bottom-8 z-10 w-36 bg-white rounded-md shadow-lg border ring-1 ring-black ring-opacity-5 py-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => startRename(img)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <Edit2 size={14} /> Rename
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleDownload(img);
                                                    setOpenMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                            <button
                                                onClick={() => handleDelete(img.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <UploadCloud size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No files yet</p>
                    <p className="text-sm text-gray-400 mt-1">Upload images, documents, or PDFs.</p>
                </div>
            )}

            {previewItem && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70" onClick={() => setPreviewItem(null)}>
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-[95vw] max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                            <div className="min-w-0 mr-4">
                                <p className="text-sm font-semibold text-gray-800 truncate" title={previewItem.title || previewItem.originalFilename}>
                                    {previewItem.title || previewItem.originalFilename}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    {previewItem.contentType} • {((previewItem.fileSize || 0) / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(previewItem)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    <Download size={14} /> Download
                                </button>
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center bg-gray-900/5 p-3">
                            {previewItem.contentType?.startsWith('image/') ? (
                                <img
                                    src={previewItem.url}
                                    alt={previewItem.title || previewItem.originalFilename}
                                    className="max-h-[80vh] max-w-[100%] object-contain rounded-lg"
                                />
                            ) : previewItem.contentType?.toLowerCase().includes('pdf') ? (
                                <iframe
                                    src={previewItem.url}
                                    title={previewItem.title || previewItem.originalFilename}
                                    className="w-full h-[80vh] rounded-lg border"
                                />
                            ) : previewItem.contentType?.toLowerCase().startsWith('video/') ? (
                                <video
                                    src={previewItem.url}
                                    controls
                                    className="w-full h-[80vh] rounded-lg bg-black"
                                />
                            ) : (previewItem.contentType?.toLowerCase().startsWith('text/')
                                || previewItem.contentType?.toLowerCase().includes('json')
                                || previewItem.contentType?.toLowerCase().includes('csv')) ? (
                                <div className="w-full h-[80vh] rounded-lg border bg-white overflow-auto p-3">
                                    {previewLoading && (
                                        <p className="text-sm text-gray-500">Loading preview…</p>
                                    )}
                                    {previewError && (
                                        <p className="text-sm text-red-500">{previewError}</p>
                                    )}
                                    {!previewLoading && !previewError && previewText && (
                                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                                            {previewText}
                                        </pre>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-500 px-4 py-8">
                                    This file type is not supported for preview. It will open in a new tab.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryView;
