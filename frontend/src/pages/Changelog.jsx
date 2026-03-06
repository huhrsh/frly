import React from 'react';

const Changelog = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Changelog</h1>
      <p className="text-sm text-gray-600 mb-6">
        A quick overview of recent improvements in fryly.
      </p>
      <ul className="space-y-4 text-sm text-gray-700">
        <li>
          <p className="font-semibold">Workspace & sections</p>
          <p>New workspace layout with focused section views, better mobile navigation, and clearer delete permissions for admins.</p>
        </li>
        <li>
          <p className="font-semibold">Payments</p>
          <p>Balances now sit at the top of the expenses view with a cleaner layout on phones and rupee amounts throughout.</p>
        </li>
        <li>
          <p className="font-semibold">Reminders & lists</p>
          <p>Reminder creation is simpler, and checklist headers adapt better to smaller screens.</p>
        </li>
      </ul>
    </div>
  );
};

export default Changelog;
