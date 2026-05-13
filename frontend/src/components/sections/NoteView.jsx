import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { parseUTCDate } from '../../utils/dateUtils';
import NoteToolbar from './NoteToolbar';

const parseContent = (raw) => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type === 'doc') return parsed;
    } catch {
        // plain text fallback
    }
    const lines = raw.split('\n');
    return {
        type: 'doc',
        content: lines
            .filter(l => l.trim() !== '')
            .map(l => ({ type: 'paragraph', content: [{ type: 'text', text: l }] }))
    };
};

const NoteView = ({ sectionId, canEdit = true }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [version, setVersion] = useState(null);
    const [lastEditedInfo, setLastEditedInfo] = useState(null);

    const editor = useEditor({
        editable: canEdit,
        extensions: [
            StarterKit,
            Underline,
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder: 'Start typing your note…' }),
            Typography,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
            Highlight.configure({ multicolor: false }),
            TextStyle,
        ],
        content: null,
        editorProps: {
            attributes: {
                class: 'note-editor focus:outline-none min-h-[260px] px-4 py-3 text-gray-800',
            },
        },
    });

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await axiosClient.get(`/groups/sections/${sectionId}/note`);
                const data = res.data || {};
                const parsed = parseContent(data.content);
                if (editor && parsed) {
                    editor.commands.setContent(parsed, false);
                }
                setVersion(data.version ?? null);
                if (data.lastEditedAt || data.lastEditedByName) {
                    setLastEditedInfo({ at: data.lastEditedAt, by: data.lastEditedByName || 'Someone' });
                }
            } catch (error) {
                console.error('Failed to fetch note', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId]);

    const handleSave = useCallback(async () => {
        if (!editor) return;
        setSaving(true);
        try {
            const content = JSON.stringify(editor.getJSON());
            const payload = { content };
            if (version !== null && version !== undefined) {
                payload.version = version;
            }

            const res = await axiosClient.put(`/groups/sections/${sectionId}/note`, payload);
            const data = res.data || {};
            setVersion(data.version ?? null);
            if (data.lastEditedAt || data.lastEditedByName) {
                setLastEditedInfo({ at: data.lastEditedAt, by: data.lastEditedByName || 'Someone' });
            }
            toast.success('Note saved');
        } catch (error) {
            if (error?.response?.status === 409) {
                toast.error('Note was updated by someone else. Please refresh.');
            } else {
                console.error('Failed to save note', error);
                toast.error('Failed to save note');
            }
        } finally {
            setSaving(false);
        }
    }, [editor, sectionId, version]);

    // Ctrl+S / Cmd+S to save
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave]);

    if (loading) return <div className="p-4 text-sm text-gray-500">Loading note...</div>;

    return (
        <div className="h-full flex flex-col sm:p-4">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Note</h2>
                    <p className="text-xs text-gray-500">{canEdit ? 'Rich text — format freely. Ctrl+S to save.' : 'View only.'}</p>
                </div>
                {lastEditedInfo && (
                    <div className="text-right mr-3 hidden sm:block">
                        <p className="text-[10px] text-gray-400">Last edited by {lastEditedInfo.by}</p>
                        {lastEditedInfo.at && (() => {
                            const date = parseUTCDate(lastEditedInfo.at);
                            return date ? (
                                <p className="text-[10px] text-gray-400">at {date.toLocaleString()}</p>
                            ) : null;
                        })()}
                    </div>
                )}
                {canEdit && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium transition disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1">
                <NoteToolbar editor={editor} />
                <div className="flex-1 overflow-y-auto bg-white">
                    <EditorContent editor={editor} />
                </div>
            </div>

            <style>{`
                .note-editor p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                }
                .note-editor ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .note-editor ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .note-editor ul ul { list-style-type: circle; }
                .note-editor ul ul ul { list-style-type: square; }
                .note-editor li { margin: 0.1rem 0; }
                .note-editor ul[data-type="taskList"] {
                    list-style: none;
                    padding-left: 0.25rem;
                }
                .note-editor ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                .note-editor ul[data-type="taskList"] li > label {
                    margin-top: 0.2rem;
                    flex-shrink: 0;
                }
                .note-editor ul[data-type="taskList"] li > div {
                    flex: 1;
                }
                .note-editor blockquote {
                    border-left: 3px solid #e5e7eb;
                    padding-left: 1rem;
                    color: #6b7280;
                    margin: 0.5rem 0;
                    font-style: italic;
                }
                .note-editor pre {
                    background: #f3f4f6;
                    border-radius: 0.375rem;
                    padding: 0.75rem 1rem;
                    font-family: monospace;
                    font-size: 0.85em;
                    overflow-x: auto;
                }
                .note-editor code:not(pre code) {
                    background: #f3f4f6;
                    border-radius: 0.25rem;
                    padding: 0.1em 0.3em;
                    font-family: monospace;
                    font-size: 0.85em;
                }
                .note-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.25rem; line-height: 1.3; }
                .note-editor h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.25rem; line-height: 1.3; }
                .note-editor h3 { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.25rem; line-height: 1.3; }
                .note-editor hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
                .note-editor p { margin: 0.2rem 0; line-height: 1.6; }
                .note-editor mark { background-color: #fef08a; border-radius: 0.2em; padding: 0 0.1em; }
                .note-editor a { color: #2563eb; text-decoration: underline; cursor: pointer; }
                .note-editor a:hover { color: #1d4ed8; }
            `}</style>
        </div>
    );
};

export default NoteView;
