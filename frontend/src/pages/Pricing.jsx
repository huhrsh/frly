import React from 'react';

const Pricing = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Pricing</h1>
      <p className="text-sm text-gray-600 mb-4">
        fryly is currently in an early, invite-only phase.
      </p>
      <p className="text-sm text-gray-600 mb-2">
        During this phase we are focused on product fit and reliability rather than complex plans. Groups have sensible storage limits built in, and we may introduce paid tiers later as the product grows.
      </p>
      <p className="text-sm text-gray-600">
        If you are using fryly with a larger team and want to talk about limits or future plans, please reach out via the contact page.
      </p>
    </div>
  );
};

export default Pricing;
