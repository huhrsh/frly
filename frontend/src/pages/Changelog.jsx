import React from 'react';
import PageMeta from '../components/PageMeta';

const Changelog = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <PageMeta
        title="fryly changelog – What’s new"
        description="See recent updates to fryly, including activity logs, search, new sections like Links, workspace improvements, payments and reminders."
      />
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Changelog</h1>
      <p className="text-sm text-gray-600 mb-6">
        A quick overview of recent improvements in fryly.
      </p>
      <ul className="space-y-4 text-sm text-gray-700">
        <li>
          <p className="font-semibold">Version 1.5 – Roles, rich text notes &amp; group controls</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Introduced a three-tier role system: <strong>Owner</strong>, <strong>Admin</strong>, <strong>Member</strong> and <strong>Viewer</strong>. Each role has distinct permissions — Owners can delete the group and reassign roles; Admins can manage sections and members; Members add content; Viewers read only.</li>
            <li>Group creators are automatically assigned the Owner role. Existing group creators have been migrated to Owner.</li>
            <li>Owners can now change any member's role and set a default join role (the role new members get when they accept an invite link).</li>
            <li>Notes now use a full rich-text editor — bold, italic, underline, headings, bullet lists, numbered lists, task (checkbox) lists, code blocks and more.</li>
            <li>Gallery downloads now use the original filename and trigger a proper browser download instead of opening in a new tab. PDF files can be previewed inline.</li>
            <li>Role badges appear directly next to member names in the group settings panel.</li>
            <li>Fixed: OWNER role was incorrectly blocked from sending email invites.</li>
            <li>Fixed: changing section currency, display mode, or parent section now requires Admin or Owner access (not just Member).</li>
            <li>Local and production environments now upload to separate Cloudinary folders, preventing path collisions.</li>
          </ul>
        </li>
        <li>
          <p className="font-semibold">Version 1.4 – Activity, search &amp; notification centre</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Added a group activity log — see a timestamped trail of everything that's happened in a group. Access it from the Settings modal (new "Activity" tab) or the history icon in the header.</li>
            <li>The history icon in the top bar now shows a quick cross-group activity feed covering all your groups at a glance.</li>
            <li>Added search — find any section or item inside your current group instantly from the header. Covers notes, lists, reminders, expenses, links, gallery files, calendar events and folders.</li>
            <li>Added a dedicated Activity &amp; Notifications page with full notification history, push-notification toggle, and a "Mark all read" button.</li>
            <li>Fixed the Settings modal tab bar so the Activity tab is never clipped on small screens.</li>
            <li>Minor overflow and layout fixes on narrow screens.</li>
          </ul>
        </li>
        <li>
          <p className="font-semibold">Version 1.3 – Section reordering for everyone</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Now you can reorder your sections and folders! Each user’s workspace order is personal and saved just for them.</li>
            <li>In workspace view, simply drag and drop sections from the left sidebar to arrange them as you like.</li>
            <li>In Overview (Bento) and inside folders, use the new “Reorder items” button to open a dedicated modal for easy reordering.</li>
            <li>Sidebar folder contents are no longer draggable—use the modal for folder reordering for a smoother experience.</li>
            <li>Reorder modal tiles now show type-based badges for a clearer, more colorful look.</li>
          </ul>
        </li>
        <li>
          <p className="font-semibold">Version 1.2 – Links, PWA & more</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Added the Links section for quick access to important links.</li>
            <li>Enhanced checklists and payment sections for better usability.</li>
            <li>fryly is now a Progressive Web App (PWA) – install it to your home screen!</li>
          </ul>
        </li>
        <li>
          <p className="font-semibold">Version 1.1 – Reminders & events</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Initial release with reminders and events sections to help you stay organised.</li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Changelog;
