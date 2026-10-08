import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import SectionView from './SectionView';
import GroupView from './GroupView';
import axiosClient from '../api/axiosClient';

const state = vi.hoisted(() => ({ group: {}, dispatch: vi.fn() }));
vi.mock('react-redux', () => ({
    useSelector: (select) => select({ group: state.group }),
    useDispatch: () => state.dispatch,
}));
vi.mock('../api/axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 10 } }) }));
vi.mock('../hooks/useSectionPreviews', () => ({ useSectionPreviews: () => ({}) }));
vi.mock('../components/SettingsModal', () => ({ default: () => null }));
vi.mock('../components/UserInfoModal', () => ({ default: () => null }));
vi.mock('../components/ReorderSectionsModal', () => ({ default: () => null }));
vi.mock('../components/CreateSectionModal', () => ({ default: () => <div>Create dialog</div> }));
vi.mock('../components/ConfirmModal', () => ({ default: ({ onConfirm }) => <button onClick={onConfirm}>Confirm delete</button> }));

vi.mock('../components/sections/NoteView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/ListView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/GalleryView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/ReminderView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/LinksSection', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/PaymentView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/CalendarView', () => ({ default: (props) => <Content {...props} /> }));
vi.mock('../components/sections/FolderView', () => ({ default: ({ onOpenCreateModal }) => (
    <div data-testid="folder-content">{onOpenCreateModal && <button onClick={() => onOpenCreateModal(20)}>Add inside</button>}</div>
) }));

function Content({ canEdit, canManage, section, sectionId }) {
    return <div data-testid="section-content" data-edit={String(canEdit)} data-manage={String(canManage)} data-currency={section?.currency} data-id={sectionId} />;
}

let sections;
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
    sections = [{ id: 20, title: 'Test section', type: 'NOTE', currency: 'USD', parentId: null }];
    state.group = { currentGroup: { id: 1, displayName: 'Test group', currentUserRole: 'OWNER', viewPreference: 'WORKSPACE' }, loading: false };
    axiosClient.get.mockImplementation(async (url) => ({ data: url === '/groups/sections' ? sections : [] }));
    axiosClient.post.mockResolvedValue({ data: {} });
    axiosClient.patch.mockResolvedValue({ data: {} });
    axiosClient.delete.mockResolvedValue({ data: {} });
});

function openPage(route = 'direct') {
    return render(<MemoryRouter initialEntries={[route === 'direct' ? '/groups/1/sections/20' : '/groups/1?view=WORKSPACE&section=20']}>
        <Link to="/groups/1/sections/21">Open next section</Link>
        <Routes>
            <Route path="/groups/:groupId/sections/:sectionId" element={<SectionView />} />
            <Route path="/groups/:groupId" element={<GroupView />} />
        </Routes>
    </MemoryRouter>);
}

describe.each(['direct', 'workspace'])('%s section permissions', (route) => {
    it.each(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER', undefined])('applies %s access across every content type', async (role) => {
        state.group.currentGroup.currentUserRole = role;
        for (const type of ['NOTE', 'LIST', 'GALLERY', 'REMINDER', 'LINKS', 'PAYMENT', 'CALENDAR']) {
            sections[0].type = type;
            openPage(route);
            const content = await screen.findByTestId('section-content');
            expect(content).toHaveAttribute('data-edit', String(['OWNER', 'ADMIN', 'MEMBER'].includes(role)));
            if (type === 'LIST' || type === 'PAYMENT') {
                expect(content).toHaveAttribute('data-manage', String(['OWNER', 'ADMIN'].includes(role)));
            }
            if (type === 'PAYMENT') expect(content).toHaveAttribute('data-currency', 'USD');
            cleanup();
        }
    });

    it.each(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])('shows correct management actions for %s', async (role) => {
        state.group.currentGroup.currentUserRole = role;
        openPage(route);
        await screen.findByTestId('section-content');
        expect(Boolean(screen.queryByRole('button', { name: 'Rename section' }))).toBe(['OWNER', 'ADMIN'].includes(role));
        expect(Boolean(screen.queryByRole('button', { name: /Delete section/ }))).toBe(role === 'OWNER');
    });

    it.each(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])('offers folder creation only to managers (%s)', async (role) => {
        state.group.currentGroup.currentUserRole = role;
        sections[0].type = 'FOLDER';
        openPage(route);
        await screen.findByTestId('folder-content');
        expect(Boolean(screen.queryByRole('button', { name: 'Add inside' }))).toBe(['OWNER', 'ADMIN'].includes(role));
    });
});

it('allows an Owner to rename and delete from the direct page', async () => {
    openPage();
    await screen.findByTestId('section-content');
    fireEvent.click(screen.getByRole('button', { name: 'Rename section' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(axiosClient.patch).toHaveBeenCalledWith('/groups/sections/20/title', { title: 'Renamed' }));
    await screen.findByRole('heading', { name: 'Renamed' });
    fireEvent.click(screen.getByRole('button', { name: /Delete section/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await waitFor(() => expect(axiosClient.delete).toHaveBeenCalledWith('/groups/sections/20'));
});

it('waits for the matching group before loading direct section content', async () => {
    state.group.currentGroup.id = 2;
    const view = openPage();
    expect(axiosClient.get).not.toHaveBeenCalled();
    expect(screen.queryByTestId('section-content')).not.toBeInTheDocument();
    state.group.currentGroup = { ...state.group.currentGroup, id: 1 };
    view.rerender(<MemoryRouter initialEntries={['/groups/1/sections/20']}><Routes><Route path="/groups/:groupId/sections/:sectionId" element={<SectionView />} /></Routes></MemoryRouter>);
    await screen.findByTestId('section-content');
    expect(axiosClient.get).toHaveBeenCalledWith('/groups/sections', { headers: { 'X-Group-ID': '1' } });
});

it('ignores an older response after navigating to another section', async () => {
    let finishOlder;
    axiosClient.get.mockImplementationOnce(() => new Promise(resolve => { finishOlder = resolve; }));
    sections.push({ id: 21, title: 'Next section', type: 'NOTE', parentId: null });
    openPage();
    await waitFor(() => expect(axiosClient.get).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('link', { name: 'Open next section' }));
    expect(await screen.findByTestId('section-content')).toHaveAttribute('data-id', '21');
    await act(async () => finishOlder({ data: [{ ...sections[0], title: 'Stale' }] }));
    expect(screen.queryByRole('heading', { name: 'Stale' })).not.toBeInTheDocument();
    expect(screen.getByTestId('section-content')).toHaveAttribute('data-id', '21');
});
