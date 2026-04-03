import React from 'react';
import PageMeta from '../components/PageMeta';

const FAQ = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <PageMeta
        title="fryly – Frequently asked questions"
        description="Answers to common questions about how fryly works for shared homes, families and close crews."
      />
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h1>
      <p className="text-sm text-gray-600 mb-6">
        Answers to common questions about how fryly works for shared homes, families and close crews.
      </p>

      <div className="space-y-6 text-sm text-gray-700">
        <div>
          <h2 className="font-semibold text-gray-900">What is fryly for?</h2>
          <p className="mt-1 text-gray-700">
            fryly is a shared home base for ongoing groups you keep coming back to: flats, families and close crews who share everyday life together. It keeps notes, lists, reminders, files, photos and shared expenses in one calm workspace instead of buried in chat.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Is fryly free?</h2>
          <p className="mt-1 text-gray-700">
            You can start using fryly for free. If we introduce paid plans in the future, we&apos;ll list them clearly on the pricing page and keep a fair free option for small everyday groups.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Do you have a mobile app?</h2>
          <p className="mt-1 text-gray-700">
            fryly is a Progressive Web App (PWA). It works great in your mobile browser and you can install it to your home screen from the browser menu, so it behaves like a lightweight app.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Who can see my groups?</h2>
          <p className="mt-1 text-gray-700">
            Groups in fryly are invite-only. Only members who have been added or approved can see the sections, notes, lists, reminders, files and expenses inside that group.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Can I be in multiple groups?</h2>
          <p className="mt-1 text-gray-700">
            Yes. You can create or join multiple groups such as your flat, your family and a recurring friend crew. Each group has its own sections and data, and switching between them is quick.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">What kind of things do people track?</h2>
          <p className="mt-1 text-gray-700">
            Common examples include rent and bill splits, grocery lists, house rules, shared trip plans, school schedules, medical information, important documents, recurring chores and shared memories.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">How do I find something in my group?</h2>
          <p className="mt-1 text-gray-700">
            Use the search bar at the top of your group view. It searches across sections, notes, list items, reminders, links, expenses, gallery files and events — just start typing and results appear instantly.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Can I see what my groupmates have been doing?</h2>
          <p className="mt-1 text-gray-700">
            Yes. Every group has an activity log that tracks changes — who added an expense, updated a note, checked off a task, and more. Find it via the history icon in the header or the Activity tab inside Group Settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
