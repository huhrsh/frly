import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="bg-gray-50">
            {/* HERO */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 border border-blue-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Shared home for your group life
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                                Organise everything your group shares in one calm space.
                            </h1>
                            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
                                Notes, to‑dos, photos, reminders and expenses — all inside a single workspace for your family, friends or flatmates. No more scattered chats and lost docs.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                            >
                                Create a free space
                            </Link>
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                            >
                                Already have a group? <span className="underline">Log in</span>
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 mt-2">
                            <span>No credit card needed</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span>Built for small, trusted groups</span>
                        </div>
                    </div>

                    {/* Illustration placeholder */}
                    <div className="relative">
                        <div className="rounded-3xl border border-dashed border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 sm:p-6 min-h-[220px] sm:min-h-[280px] flex items-center justify-center">
                            <div className="text-center max-w-xs">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Illustration area</p>
                                <p className="text-[11px] text-blue-800/80">
                                    Drop in your own hero illustration or characters here — this card is sized for a wide scene.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* KEY SURFACES */}
            <section className="border-t border-gray-200 bg-white/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-sm font-semibold tracking-wide text-blue-600 uppercase">Everything in one place</h2>
                            <p className="mt-1 text-lg font-semibold text-gray-900">Sections keep your group organised by purpose.</p>
                            <p className="mt-1 text-sm text-gray-500 max-w-xl">
                                Each group gets a flexible workspace made of sections. Mix and match notes, lists, galleries, reminders and expenses — like building blocks.
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Examples:</span> Trip planning, chores, bills, shared photos, shopping lists and more.
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
                            <p className="text-xs text-gray-600">Capture plans, recipes, decisions and long‑form thoughts for everyone to reference.</p>
                            <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white/80 h-20 flex items-center justify-center text-[11px] text-gray-400">
                                Note preview illustration
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Lists &amp; reminders</h3>
                            <p className="text-xs text-gray-600">Shared checklists with due dates — perfect for chores, packing and recurring tasks.</p>
                            <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white/80 h-20 flex items-center justify-center text-[11px] text-gray-400">
                                Tasks / reminder illustration
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Files &amp; expenses</h3>
                            <p className="text-xs text-gray-600">Keep photos, documents and shared expenses attached to the group instead of chats.</p>
                            <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white/80 h-20 flex items-center justify-center text-[11px] text-gray-400">
                                Gallery / payments illustration
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-gray-50 border-t border-gray-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-2xl mb-8">
                        <h2 className="text-lg font-semibold text-gray-900">Built for real‑world groups</h2>
                        <p className="mt-2 text-sm text-gray-600">FRYLY works best for people who already talk every day — families, flatmates, close teams and friend circles.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">1</span>
                            <h3 className="text-sm font-semibold text-gray-900">Create your group space</h3>
                            <p className="text-xs text-gray-600">Set a name, invite code and a cover emoji or illustration that fits your group.</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">2</span>
                            <h3 className="text-sm font-semibold text-gray-900">Add only the sections you need</h3>
                            <p className="text-xs text-gray-600">Start with a couple of sections — like “Groceries” and “Bills” — and grow over time.</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">3</span>
                            <h3 className="text-sm font-semibold text-gray-900">Stay in sync without more chats</h3>
                            <p className="text-xs text-gray-600">Everyone sees the same source of truth — no more scrolling through messages to find “that one detail”.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECONDARY ILLUSTRATION STRIP */}
            <section className="bg-white border-t border-gray-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1 space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900">Leave the chaos to your chats.</h2>
                        <p className="text-sm text-gray-600 max-w-md">
                            FRYLY is for everything that shouldn&apos;t disappear in a feed: packing lists, house rules, vacation plans, loaned items, important dates and more.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Families</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Flatmates</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Travel groups</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Close teams</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 h-52 sm:h-64 flex items-center justify-center px-4">
                            <div className="text-center max-w-xs">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Secondary illustration</p>
                                <p className="text-[11px] text-gray-500">
                                    Use this canvas for a smaller scene — e.g. people around a shared board, or multiple devices in sync.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
