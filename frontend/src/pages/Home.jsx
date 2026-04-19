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
                console.error('Failed to load reviews', error);
            }
        };
        loadReviews();
    }, []);

    return (
        <div className="bg-white">
            <PageMeta
                title="fryly – Shared home base for flats, families and close crews"
                description="Fryly is a calm shared home base for the people you live and plan with every week – flats, families and recurring crews. Keep notes, lists, reminders, links, photos and expenses organised together outside noisy chats."
            />

            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-700 mb-6">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            For flatmates, families and close crews
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                            Your group chat is a mess.<br />
                            <span className="text-blue-600">Fryly fixes that.</span>
                        </h1>
                        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            One organised space for the people you live and plan with — checklists, shared expenses, reminders and more. No more scrolling through chats to find "that thing".
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
                                Join with an invite code
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Free · No credit card · Takes 30 seconds
                        </p>
                    </div>
                </div>
            </section>

            {/* PAIN vs FRYLY — moved up, most compelling section */}
            <section className="py-16 bg-gray-50">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Use WhatsApp for talking · Use fryly for everything else
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-4">In group chats...</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">✕</span><span>Plans get buried under memes and reactions</span></li>
                                <li className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">✕</span><span>Scroll forever to find "that link someone shared"</span></li>
                                <li className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">✕</span><span>"Who owes what?" becomes a whole argument</span></li>
                                <li className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">✕</span><span>Photos and docs vanish in message history</span></li>
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-green-50 border-2 border-green-300 p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-4">With fryly...</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">✓</span><span>Checklists everyone can tick off in real time</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">✓</span><span>Expenses tracked — who paid, who owes, settled</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">✓</span><span>Reminders, notes and files always findable</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">✓</span><span>One source of truth your whole group can see</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES — Lists & Payments first */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Everything your group actually needs
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Mix and match sections — start with 2, add more as you go
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        <div className="group relative rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">✅</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Checklists</h3>
                            <p className="text-sm text-gray-700 mb-3">Groceries, chores, packing — check things off together in real time</p>
                            <div className="text-xs text-green-700 font-medium">Shared checkboxes · Everyone can tick</div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">💸</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Expense Splits</h3>
                            <p className="text-sm text-gray-700 mb-3">Track who paid what, split bills fairly, settle up in one tap</p>
                            <div className="text-xs text-blue-700 font-medium">Balances · Settlements · History</div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 border-2 border-pink-100 hover:border-pink-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">🖼️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Shared Gallery</h3>
                            <p className="text-sm text-gray-700 mb-3">Trip photos, receipts, documents — all in one shared album</p>
                            <div className="text-xs text-pink-700 font-medium">Upload · Browse · Download</div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">📝</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Notes</h3>
                            <p className="text-sm text-gray-700 mb-3">House rules, trip itineraries, recipes — anyone can edit</p>
                            <div className="text-xs text-amber-700 font-medium">Rich text · Collaborative</div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 p-6 border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">🔔</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reminders</h3>
                            <p className="text-sm text-gray-700 mb-3">Rent due, bill dates, chores — never miss what matters</p>
                            <div className="text-xs text-purple-700 font-medium">Email alerts · Due dates</div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="text-2xl mb-2">📅</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar</h3>
                            <p className="text-sm text-gray-700 mb-3">Shared events, trips and important dates at a glance</p>
                            <div className="text-xs text-indigo-700 font-medium">Group timeline · Visual view</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHO IT'S FOR */}
            <section className="py-16 bg-gradient-to-b from-blue-50 via-white to-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Who uses fryly?</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
                        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 border-2 border-purple-100">
                            <div className="text-2xl mb-2">🏠</div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Flatmates &amp; PGs</h3>
                            <p className="text-xs text-gray-600">"Whose turn to clean?" "Did someone pay Wi-Fi?" — chore rotas, bill splits and groceries in one place.</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 border-2 border-blue-100">
                            <div className="text-2xl mb-2">✈️</div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Trip squads</h3>
                            <p className="text-xs text-gray-600">Itineraries, bookings, shared links, who-paid-what — reuse the same group every trip.</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border-2 border-emerald-100">
                            <div className="text-2xl mb-2">👨‍👩‍👧</div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Families</h3>
                            <p className="text-xs text-gray-600">"When's the parent-teacher meet?" — calendars, important documents and to-dos the whole family can see.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF */}
            {reviews && reviews.length > 0 && (
                <section className="py-16 bg-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Early groups love it</h2>
                            <p className="text-gray-500 text-sm">Real words from people using fryly</p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
                            {reviews.map((review) => (
                                <div key={review.id} className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
                                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i}>{i < (review.rating || 0) ? '★' : '☆'}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed mb-4">"{review.message}"</p>
                                    <p className="text-xs text-gray-400 font-medium">— fryly user</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FINAL CTA */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
                        Stop losing plans in chat.
                    </h2>
                    <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-xl mx-auto">
                        Set up your group in 2 minutes. Invite your people. See the difference.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-blue-600 px-8 py-4 text-lg font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-2xl"
                        >
                            Create your group — free
                        </Link>
                        <Link
                            to="/login"
                            className="text-white underline text-base font-medium hover:text-blue-100"
                        >
                            or join with an invite code
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-blue-200">
                        No credit card · No trial limits · Just create and go
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Home;
