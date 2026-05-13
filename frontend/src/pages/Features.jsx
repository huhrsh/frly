import React from 'react';
import PageMeta from '../components/PageMeta';

const Features = () => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      <PageMeta
        title="fryly features – Sections, workspaces and shared tools"
        description="Explore what you get with fryly: shared groups, flexible sections for notes, lists, reminders, links, galleries, payments and more."
      />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">What you get with fryly</h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          fryly gives your group a calm, shared workspace made of sections – so everyone knows where to put things and where to find them.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 text-sm text-gray-700">
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Groups &amp; roles</p>
          <h2 className="font-semibold">Owner, Admin, Member, Viewer</h2>
          <p>
            Every group has a four-tier role system. Owners manage the group and assign roles. Admins create sections, approve requests and invite members. Members add notes, items, photos and payments. Viewers can read but not change anything.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Sections</p>
          <h2 className="font-semibold">Flexible building blocks</h2>
          <p>
            Create as many sections as you need: rich-text notes, checklists, reminders, galleries, folders, links and payments. Mix them to fit your use-case – from "PG groceries" to "Trip itinerary" and "Family docs".
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Workspace</p>
          <h2 className="font-semibold">Calm group view</h2>
          <p>
            Switch between a focused workspace for one section and an overview grid that shows the whole group at a glance – no feeds, no noise, just shared context.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Tasks</p>
          <h2 className="font-semibold">Checklists &amp; reminders</h2>
          <p>
            Use shared lists to track chores, packing, or errands, and attach due dates so fryly can remind you when something is close or overdue.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Money</p>
          <h2 className="font-semibold">Shared expenses</h2>
          <p>
            Record who paid for what, split bills fairly, and see simple balances per person after trips, dinners or monthly rent.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Staying in sync</p>
          <h2 className="font-semibold">Notifications that matter</h2>
          <p>
            Get notified when someone joins your group, admins approve requests, or important things happen. Check the activity log for a full history of what your group has been up to — without turning your workspace into another noisy chat.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Search</p>
          <h2 className="font-semibold">Find anything, fast</h2>
          <p>
            Search across every section type — notes, lists, reminders, links, expenses, files and more — from one bar. No need to remember which section something is in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Features;
