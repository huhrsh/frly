import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import PageMeta from '../components/PageMeta';

const Feedback = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const initialGroupId = params.get('groupId');

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please share at least a few words.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        message: message.trim(),
      };
      if (initialGroupId) {
        const parsed = parseInt(initialGroupId, 10);
        if (!Number.isNaN(parsed)) {
          payload.groupId = parsed;
        }
      }
      await axiosClient.post('/feedback', payload);
      toast.success('Thanks for your feedback.');
      setMessage('');
    } catch (error) {
      console.error('Failed to send feedback', error);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gray-50 flex items-center justify-center px-4 py-4 sm:py-8">
      <PageMeta
        title="Share feedback — fryly"
        description="Help us improve fryly. Share your thoughts, ideas, and suggestions with the team."
      />
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              We're all ears
            </h1>
            <p className="text-sm text-gray-700 max-w-md">
              Your feedback shapes <span className="text-blue-600 lowercase font-semibold">fryly</span>. Tell us what's working, what's not, and what you'd love to see next.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Goes directly to the team</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />We read and consider everything</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Help us build what you need</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8">
          <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
            Share your feedback
          </h2>
          <p className="mt-1 text-xs text-center text-slate-500">Tell us what's confusing, missing, or could be better.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">Your feedback</label>
              <div className="mt-2">
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your ideas, pain points, or anything on your mind..."
                  rows={6}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3 resize-none"
                />
              </div>
              {initialGroupId && (
                <p className="mt-2 text-xs text-slate-400">
                  Linked to this group so we can understand your context better.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
