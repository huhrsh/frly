import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const Review = () => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [showPublicly, setShowPublicly] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please pick a rating between 1 and 5.');
      return;
    }
    if (!message.trim()) {
      toast.error('A short note about your experience helps others.');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/review', {
        rating,
        message: message.trim(),
        showPublicly,
      });
      toast.success('Thanks for the review!');
      setMessage('');
      setRating(5);
      setShowPublicly(true);
    } catch (error) {
      console.error('Failed to send review', error);
      toast.error('Failed to send review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gray-50 flex items-center justify-center px-4 py-4 sm:py-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              How's it going?
            </h1>
            <p className="text-sm text-gray-700 max-w-md">
              We'd love to hear about your experience with <span className="text-blue-600 lowercase font-semibold">fryly</span>. Your review helps us improve and helps others discover us.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Share what you love</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Help others make decisions</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Optional public testimonial</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8">
          <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
            Rate your experience
          </h2>
          <p className="mt-1 text-xs text-center text-slate-500">Share a quick rating and a short note about fryly.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Rating</label>
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/60 px-3 py-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`px-2 py-1 rounded-full w-7 text-sm font-medium transition ${
                        rating === value
                          ? 'bg-yellow-400 text-gray-900'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">What's your experience been like?</label>
              <div className="mt-2">
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A sentence or two is perfect."
                  rows={5}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="showPublicly"
                type="checkbox"
                checked={showPublicly}
                onChange={(e) => setShowPublicly(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 accent-blue-600"
              />
              <label htmlFor="showPublicly" className="text-xs text-slate-600">
                You can show this on the fryly home page as a testimonial.
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Review;
