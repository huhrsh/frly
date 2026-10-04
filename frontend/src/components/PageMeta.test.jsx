import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import PageMeta from './PageMeta';

it('updates canonicals and removes public schema when navigating into a private group', async () => {
  render(<MemoryRouter initialEntries={['/split-expenses']}><PageMeta /><Link to="/groups/123">Private group</Link><Link to="/group-trip-planner">Trip guide</Link></MemoryRouter>);
  await waitFor(() => expect(document.title).toContain('Split Expenses'));
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://fryly.vercel.app/split-expenses');
  expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  fireEvent.click(screen.getByText('Private group'));
  await waitFor(() => expect(document.querySelector('meta[name="robots"]').content).toBe('noindex,follow'));
  expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  expect(document.querySelector('meta[property="og:url"]').content).toBe('https://fryly.vercel.app/groups/123');
  fireEvent.click(screen.getByText('Trip guide'));
  await waitFor(() => expect(document.title).toContain('Group Trip Planner'));
  expect(document.querySelector('meta[name="robots"]').content).toBe('index,follow');
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://fryly.vercel.app/group-trip-planner');
});
