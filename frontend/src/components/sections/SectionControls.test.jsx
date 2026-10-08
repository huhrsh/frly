import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import PaymentView from './PaymentView';
import ListView from './ListView';
import LinksSection from './LinksSection';
import NoteView from './NoteView';
import axiosClient from '../../api/axiosClient';

const editor = vi.hoisted(() => ({
    setEditable: vi.fn(), getJSON: () => ({ type: 'doc', content: [] }),
    commands: { setContent: vi.fn() },
}));
vi.mock('@tiptap/react', () => ({ useEditor: () => editor, EditorContent: () => <div>Editor</div> }));
vi.mock('./NoteToolbar', () => ({ default: () => null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 10 } }) }));
vi.mock('../../api/axiosClient', () => ({ default: { get: vi.fn(), patch: vi.fn(), put: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@hello-pangea/dnd', () => ({
    DragDropContext: ({ children, onDragEnd }) => <div>{children}<button onClick={() => onDragEnd({ source: { index: 0 }, destination: { index: 1 } })}>Test reorder</button></div>,
    Droppable: ({ children }) => children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }),
    Draggable: ({ children, isDragDisabled }) => children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: isDragDisabled ? null : {} }, {}),
}));

const links = [
    { id: 1, key: 'First link', url: 'https://example.com/first' },
    { id: 2, key: 'Second link', url: 'https://example.com/second' },
];
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('currentGroupId', '1');
    axiosClient.get.mockImplementation(async (url) => {
        if (url.endsWith('/links')) return { data: links };
        if (url.endsWith('/note')) return { data: { content: '{"type":"doc","content":[]}', version: 1 } };
        if (url.endsWith('/expenses')) return { data: { content: [] } };
        if (url.endsWith('/total')) return { data: 0 };
        return { data: [] };
    });
    axiosClient.patch.mockResolvedValue({ data: {} });
    axiosClient.put.mockResolvedValue({ data: {} });
});

it('shows configured currency and prevents non-managers from changing it', async () => {
    render(<PaymentView sectionId={20} section={{ id: 20, currency: 'USD' }} canEdit />);
    const select = screen.getByRole('combobox', { name: 'Section currency' });
    expect(select).toHaveValue('USD');
    expect(select).toBeDisabled();
    fireEvent.change(select, { target: { value: 'EUR' } });
    expect(axiosClient.patch).not.toHaveBeenCalled();
    await waitFor(() => expect(axiosClient.get).toHaveBeenCalled());
});

it('rolls currency back and reports a failed save', async () => {
    axiosClient.patch.mockRejectedValueOnce(new Error('Denied'));
    render(<PaymentView sectionId={20} section={{ id: 20, currency: 'USD' }} canManage />);
    const select = screen.getByRole('combobox', { name: 'Section currency' });
    fireEvent.change(select, { target: { value: 'EUR' } });
    await waitFor(() => expect(select).toHaveValue('USD'));
    expect(toast.error).toHaveBeenCalledWith('Failed to update section currency');
    expect(select).toBeEnabled();
});

it('allows managers to save currency and synchronizes a new section', async () => {
    const view = render(<PaymentView sectionId={20} section={{ id: 20, currency: 'USD' }} canManage />);
    const select = screen.getByRole('combobox', { name: 'Section currency' });
    fireEvent.change(select, { target: { value: 'EUR' } });
    await waitFor(() => expect(axiosClient.patch).toHaveBeenCalledWith('/groups/sections/20/currency', { currency: 'EUR' }));
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveValue('EUR');
    await act(async () => view.rerender(<PaymentView sectionId={21} section={{ id: 21, currency: 'GBP' }} canManage />));
    expect(select).toHaveValue('GBP');
});

it('restricts shared checklist settings while preserving member content editing', async () => {
    const view = render(<ListView sectionId={20} section={{ id: 20 }} canEdit />);
    const bullets = screen.getByRole('button', { name: 'Bullets' });
    expect(bullets).toBeDisabled();
    fireEvent.click(bullets);
    expect(axiosClient.patch).not.toHaveBeenCalled();
    view.rerender(<ListView sectionId={20} section={{ id: 20 }} canEdit canManage />);
    fireEvent.click(bullets);
    await waitFor(() => expect(axiosClient.patch).toHaveBeenCalledWith('/groups/sections/20/display-mode', { listDisplayMode: 'UNORDERED' }));
});

it('prevents Viewer link dragging and reorder writes', async () => {
    render(<LinksSection sectionId={20} />);
    await screen.findByRole('link', { name: 'First link' });
    expect(screen.queryByTitle('Drag to reorder')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Test reorder' }));
    expect(axiosClient.patch).not.toHaveBeenCalled();
});

it('restores the original link order on a failed reorder', async () => {
    axiosClient.patch.mockRejectedValueOnce(new Error('Denied'));
    render(<LinksSection sectionId={20} canEdit />);
    await screen.findByRole('link', { name: 'First link' });
    fireEvent.click(screen.getByRole('button', { name: 'Test reorder' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to reorder links'));
    expect(screen.getAllByRole('link', { name: /link$/ }).map(link => link.textContent)).toEqual(['First link', 'Second link']);
});

it('blocks Ctrl+S for a Viewer and updates editor access when the role changes', async () => {
    const view = render(<NoteView sectionId={20} />);
    await screen.findByText('Editor');
    expect(editor.setEditable).toHaveBeenLastCalledWith(false);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(axiosClient.put).not.toHaveBeenCalled();
    view.rerender(<NoteView sectionId={20} canEdit />);
    expect(editor.setEditable).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await waitFor(() => expect(axiosClient.put).toHaveBeenCalledWith('/groups/sections/20/note', { content: '{"type":"doc","content":[]}', version: 1 }));
});
