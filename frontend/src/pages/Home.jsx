import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PageMeta from '../components/PageMeta';

const Home = () => {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const loadReviews = async () => {
            try {
                const res = await axiosClient.get('/review/public');
                setReviews(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
            } catch (error) {
                // keep homepage fast even if reviews fail
                console.error('Failed to load reviews', error);
            }
        };
        loadReviews();
    }, []);

    return (
        <div className="bg-white">
            <PageMeta
                title="fryly – Shared workspace for flatmates, families and groups"
                description="Create a calm shared workspace for your group. Keep notes, lists, reminders, links, photos and expenses organised together in fryly."
            />
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700 mb-6">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            Your group's shared space
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            Stop losing plans in chat.
                        </h1>
                        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            One shared workspace for flatmates, families & small groups. Keep lists, plans, photos and payments in sync.
                        </p>
                        
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                            >
                                Create a group — it's free
                            </Link>
                            <Link
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
                            >
                                Join existing group
                            </Link>
                        </div>

                        <p className="mt-6 text-sm text-gray-500">
                            No credit card · No setup hassle · Just create and invite
                        </p>
                    </div>

                    {/* Visual Feature Preview - Who uses fryly */}
                    <div className="mt-40 max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Who uses fryly?</h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600">Real groups solving real problems</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="group rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 border-2 border-purple-100 hover:border-purple-200 transition-all hover:shadow-lg">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Flatmates &amp; PGs</h3>
                                <p className="text-xs text-gray-600">
                                    "Who's turn to clean?" "Did someone pay the Wi-Fi bill?" Keep chore rotas, bill splits, and household rules in one place everyone can check.
                                </p>
                                <p className="mt-3 text-xs font-medium text-gray-700">Chores · Bills · Groceries · Maintenance</p>
                            </div>
                            <div className="group rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 border-2 border-blue-100 hover:border-blue-200 transition-all hover:shadow-lg">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Trips &amp; Travel</h3>
                                <p className="text-xs text-gray-600">
                                    "Where's the hotel booking?" "Who paid for dinner?" Track itineraries, flight details, split expenses, and store trip photos in a shared album everyone can access.
                                </p>
                                <p className="mt-3 text-xs font-medium text-gray-700">Itinerary · Bookings · Photos · Expenses</p>
                            </div>
                            <div className="group rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border-2 border-emerald-100 hover:border-emerald-200 transition-all hover:shadow-lg">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Families</h3>
                                <p className="text-xs text-gray-600">
                                    "When's the parent-teacher meet?" "Where did we save that insurance doc?" Maintain calendars, important documents, medical info, and shared to-dos the whole family can see.
                                </p>
                                <p className="mt-3 text-xs font-medium text-gray-700">Events · Documents · Tasks · Important dates</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHAT YOU CAN DO - Visual Feature Grid */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Build your group workspace with sections
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Mix and match the tools your group actually needs
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        {/* Note Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Notes</h3>
                            <p className="text-sm text-gray-700 mb-3">House rules, plans, recipes — anything worth writing down</p>
                            <div className="text-xs text-amber-700 font-medium">Everyone can edit • Rich text</div>
                        </div>

                        {/* List Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Lists</h3>
                            <p className="text-sm text-gray-700 mb-3">Grocery lists, packing, to-dos — check things off together</p>
                            <div className="text-xs text-green-700 font-medium">Shared checkboxes • Real-time sync</div>
                        </div>

                        {/* Reminders Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 p-6 border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reminders</h3>
                            <p className="text-sm text-gray-700 mb-3">Bills, chores, events — never miss what matters</p>
                            <div className="text-xs text-purple-700 font-medium">Email alerts • Due dates</div>
                        </div>

                        {/* Gallery Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 border-2 border-pink-100 hover:border-pink-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Gallery</h3>
                            <p className="text-sm text-gray-700 mb-3">Trip photos, receipts, documents — stored together</p>
                            <div className="text-xs text-pink-700 font-medium">Shared albums • Easy uploads</div>
                        </div>

                        {/* Payments Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Payments</h3>
                            <p className="text-sm text-gray-700 mb-3">Track who paid what — split bills fairly</p>
                            <div className="text-xs text-blue-700 font-medium">Split costs • Keep records</div>
                        </div>

                        {/* Calendar Section */}
                        <div className="group relative rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar</h3>
                            <p className="text-sm text-gray-700 mb-3">Shared events, trips, important dates at a glance</p>
                            <div className="text-xs text-indigo-700 font-medium">Group timeline • Visual view</div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 text-sm">
                            <span className="font-semibold text-gray-900">Pro tip:</span> Start with 2-3 sections. Add more as you need them.
                        </p>
                    </div>
                </div>
            </section>

            {/* HOW TO GET STARTED - Dual Path */}
            <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Ready in 2 minutes
                        </h2>
                        <p className="text-lg text-gray-600">
                            Choose your path
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Create Path */}
                        <div className="relative rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white shadow-2xl hover:shadow-3xl transition-all hover:shadow-indigo-300">
                            {/* <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 rounded-full px-4 py-2 text-xs font-bold shadow-lg">
                                Most Popular
                            </div> */}
                            <h3 className="text-2xl font-bold mb-6">Start Your Own Group</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">1</div>
                                    <div>
                                        <p className="font-semibold">Sign up for free</p>
                                        <p className="text-sm text-blue-100">Takes 30 seconds. No credit card.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">2</div>
                                    <div>
                                        <p className="font-semibold">Create your group</p>
                                        <p className="text-sm text-blue-100">Name it "Flatmates" or "Trip squad" — you're the admin</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">3</div>
                                    <div>
                                        <p className="font-semibold">Invite your people</p>
                                        <p className="text-sm text-blue-100">Share the code or send email invites</p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/register"
                                className="block w-full text-center bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                            >
                                Create my group →
                            </Link>
                        </div>

                        {/* Join Path */}
                        <div className="relative rounded-3xl bg-white border-2 border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all hover:border-gray-300">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Join Existing Group</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700">1</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Get the invite</p>
                                        <p className="text-sm text-gray-600">Your friend/flatmate shares a code or link</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700">2</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Sign up & join</p>
                                        <p className="text-sm text-gray-600">Use the code to request access</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700">3</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">You're in!</p>
                                        <p className="text-sm text-gray-600">Admin approves and you see everything</p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/login"
                                className="block w-full text-center bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all"
                            >
                                I have an invite code →
                            </Link>
                        </div>
                    </div>

                    {/* Admin vs Member Info */}
                    <div className="mt-12 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-bold text-gray-900">Group Admins</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Create & manage sections</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Invite & remove members</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Full control over the workspace</span>
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-bold text-gray-900">Group Members</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Add notes, tasks, photos, payments</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>See everything in real-time</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>Stay in sync with the group</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* REVIEWS / SOCIAL PROOF */}
            {reviews && reviews.length > 0 && (
                <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                                Early groups love it
                            </h2>
                            <p className="text-gray-600">Real words from people using fryly</p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="relative rounded-2xl bg-white p-6 shadow-lg border-2 border-transparent hover:border-purple-200 transition-all"
                                >
                                    <div className="flex items-center gap-1 text-lg text-amber-400 mb-3">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <span key={index}>{index < (review.rating || 0) ? '★' : '☆'}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                                        "{review.message}"
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">— fryly user</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* WHY FRYLY - Simple comparison */}
            <section className="py-16 bg-white">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Works alongside your chats
                        </h2>
                        <p className="text-lg text-gray-600">
                            Use WhatsApp for talking · Use fryly for everything else
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">In group chats...</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span>Plans get buried under memes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span>Scroll forever to find "that link"</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span>Someone always misses the update</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span>Photos vanish in message history</span>
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-2xl bg-green-50 border-2 border-green-300 p-6 relative">
                            {/* <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                                Better
                            </div> */}
                            <h3 className="text-lg font-bold text-gray-900 mb-4">With fryly...</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>Everything in its place, always</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>Everyone sees the same thing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>Reminders so nothing's forgotten</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>One source of truth for your group</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
                        Ready to stop losing plans in chat?
                    </h2>
                    <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Join hundreds of flatmates, families and trip crews who switched to fryly
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-blue-600 px-8 py-4 text-lg font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-2xl"
                        >
                            Create your group
                        </Link>
                        <Link
                            to="/login"
                            className="text-white underline text-lg font-semibold hover:text-blue-100"
                        >
                            or join with an invite code
                        </Link>
                    </div>
                    <p className="mt-8 text-sm text-blue-200">
                        No credit card · No trial limits · Just create and go
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Home;
