import React from 'react';
import PageMeta from '../components/PageMeta';

const About = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <PageMeta
        title="About fryly – Shared workspace for everyday groups"
        description="Learn why we built fryly: a simple shared workspace for families, flatmates, trips and small teams to stay organised together."
      />
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">About fryly</h1>
      <p className="text-sm text-gray-600 mb-4">
        fryly is a shared workspace for families, friends, and small teams who want a single place to keep track of everyday life together.
      </p>
      <p className="text-sm text-gray-600 mb-2">
        Instead of juggling separate apps for notes, to-dos, files, reminders, and expenses, each group in fryly gets its own organised set of sections that stay in sync for everyone.
      </p>
      <p className="text-sm text-gray-600">
        The goal is a calm, structured space that feels friendly on both desktop and phones, without the overhead of heavy project-management tools.
      </p>
    </div>
  );
};

export default About;
