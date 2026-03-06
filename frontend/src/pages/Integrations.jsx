import React from 'react';

const Integrations = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Integrations</h1>
      <p className="text-sm text-gray-600 mb-4">
        fryly is intentionally lightweight today. Most organising happens directly inside groups, without needing a long list of external tools.
      </p>
      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-700 space-y-2">
        <p className="font-semibold">Email notifications</p>
        <p>
          Right now fryly integrates with email: we can notify you about account actions, group invites, and important reminders so you don&apos;t miss anything.
        </p>
        <p className="text-xs text-gray-500">
          As we grow, we may explore simple exports and calendar-style hooks – but the core idea is to keep your everyday group life inside fryly, not scattered across many apps.
        </p>
      </div>
    </div>
  );
};

export default Integrations;
