import React from 'react';
import { Link } from 'react-router-dom';

const columns = [
  { title: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['What’s new', '/changelog'], ['FAQs', '/faq']] },
  { title: 'Explore', links: [['Group management', '/group-management-app'], ['Expense splitting', '/split-expenses'], ['Trip planning', '/group-trip-planner'], ['Shared checklists', '/shared-checklist-app'], ['Shared notes', '/shared-notes-app'], ['For roommates', '/roommate-organizer']] },
  { title: 'Get in touch', links: [['About Fryly', '/about'], ['Contact', '/contact'], ['Feedback', '/feedback'], ['Leave a review', '/review']] },
];
const projects = [['Daylo', 'https://the-daylo.vercel.app/'], ['Dosia', 'https://dosia.vercel.app/'], ['boring qrs', 'https://boring-qrs.vercel.app/'], ['Portify', 'https://the-portify.vercel.app/']];
const linkStyle = 'rounded-sm transition-colors hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 py-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link to="/" aria-label="Fryly home" className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
              <img src="/teamwork.png" alt="" width="28" height="28" className="h-7 w-7" />
              <span className="text-2xl font-extrabold tracking-tight text-blue-600">fryly</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Less scrolling. More doing together.<br />Plans, notes and shared expenses in one place.</p>
          </div>
          {columns.map(column => (
            <nav key={column.title} aria-label={column.title}>
              <p className="mb-4 text-xs font-semibold tracking-wide text-slate-900">{column.title}</p>
              <ul className="space-y-2.5 text-sm leading-5 text-slate-500">
                {column.links.map(([label, path]) => <li key={path}><Link to={path} className={linkStyle}>{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-100 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Made with care by <a href="https://the-portify.vercel.app/huhrsh" className={`${linkStyle} font-medium text-slate-700`}>Harsh Jain</a></p>
          <nav aria-label="More projects" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="text-slate-400">Also built</span>
            {projects.map(([label, url]) => <a key={url} href={url} className={linkStyle}>{label}</a>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
