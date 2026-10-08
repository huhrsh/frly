import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BentoGrid from './BentoGrid';
import FolderView from './sections/FolderView';
import { formatSectionMoney } from '../utils/sectionPresentation';

vi.mock('../hooks/useSectionPreviews', () => ({ useSectionPreviews: () => ({}) }));

it('renders signed expense previews in the configured currency', () => {
    render(<MemoryRouter><BentoGrid groupId={1} sections={[{ id: 20, title: 'Trip', type: 'PAYMENT', currency: 'USD' }]} previews={{ 20: { kind: 'PAYMENT', balance: -12.5, totalSpent: 25 } }} /></MemoryRouter>);
    expect(screen.getByText(formatSectionMoney(-12.5, 'USD'))).toBeInTheDocument();
    expect(screen.getByText(formatSectionMoney(25, 'USD'))).toBeInTheDocument();
});

it('does not crash previews for legacy non-ISO currency values', () => {
    expect(formatSectionMoney(-5, 'RUPEES')).toBe('RUPEES -5.00');
});

it('keeps failed expense previews from looking like zero balances', () => {
    render(<MemoryRouter><BentoGrid groupId={1} sections={[{ id: 20, title: 'Trip', type: 'PAYMENT' }]} previews={{ 20: { kind: 'PAYMENT', error: true } }} /></MemoryRouter>);
    expect(screen.getByText('Preview unavailable. Open section to retry.')).toBeInTheDocument();
    expect(screen.queryByText('Total spent')).not.toBeInTheDocument();
});

it('labels nested Calendar and Links cards correctly and supports keyboard opening', () => {
    const select = vi.fn();
    render(<MemoryRouter><FolderView sectionId={10} allSections={[
        { id: 20, parentId: 10, title: 'Events', type: 'CALENDAR' },
        { id: 21, parentId: 10, title: 'Resources', type: 'LINKS' },
    ]} onSelectSection={select} /></MemoryRouter>);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('link', { name: /Events/ }), { key: 'Enter' });
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: 20 }));
});
