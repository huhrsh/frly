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
                                One shared workspace for everything your group needs.
                            </h1>
                            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
                                FRYLY is where your group keeps plans, chores, photos, payments and reminders – not buried in chat. Each group gets a private space made of sections like notes, lists, galleries and expenses.
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

                {/* Product preview instead of illustration */}
                <div className="relative">
                    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 sm:p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 mb-3 text-center sm:text-left">
                            What a FRYLY group actually looks like
                        </p>
                        <div className="space-y-2">
                            <div className="rounded-2xl bg-white/90 border border-blue-50 px-3 py-2 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-900">🏠 Flatmates · "Bills & Chores"</p>
                                    <p className="text-[11px] text-gray-500">Sections: Groceries list · Cleaning rota · Rent & utilities</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-[10px] font-medium text-emerald-700">Everyone sees the same list</span>
                            </div>
                            <div className="rounded-2xl bg-white/90 border border-indigo-50 px-3 py-2 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-900">✈️ Friends · "Trip to Goa"</p>
                                    <p className="text-[11px] text-gray-500">Sections: Itinerary notes · Packing list · Gallery · Payments</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-[10px] font-medium text-indigo-700">Plans, photos & costs together</span>
                            </div>
                            <div className="rounded-2xl bg-white/90 border border-slate-100 px-3 py-2 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-900">👨‍👩‍👧 Family · "Home base"</p>
                                    <p className="text-[11px] text-gray-500">Sections: House rules · Important dates · Shared tasks · Docs</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-[10px] font-medium text-slate-700">Things that shouldn&apos;t live in chat</span>
                            </div>
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
                            <p className="text-xs text-gray-600">Capture plans, recipes, house rules or trip details in one place everyone can find.</p>
                            <div className="mt-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 space-y-1">
                                <p className="text-[11px] font-medium text-gray-800">Example:</p>
                                <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
                                    <li>"Weekend plan" with check‑in times and locations</li>
                                    <li>"House rules" everyone agreed on</li>
                                </ul>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Lists &amp; reminders</h3>
                            <p className="text-xs text-gray-600">Shared checklists with due dates — perfect for chores, packing and recurring tasks.</p>
                            <div className="mt-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 space-y-1">
                                <p className="text-[11px] font-medium text-gray-800">Example:</p>
                                <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
                                    <li>"Groceries" list shared with flatmates</li>
                                    <li>Cleaning rota with reminders before guests arrive</li>
                                </ul>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Gallery &amp; expenses</h3>
                            <p className="text-xs text-gray-600">Keep photos, documents and shared expenses attached to the group instead of chats.</p>
                            <div className="mt-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 space-y-1">
                                <p className="text-[11px] font-medium text-gray-800">Example:</p>
                                <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
                                    <li>Trip photos saved to the group gallery</li>
                                    <li>"Who paid what" after dinner or a weekend away</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-gray-50 border-t border-gray-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-2xl mb-8">
                        <h2 className="text-lg font-semibold text-gray-900">How FRYLY works in 3 steps</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            When you sign in we guide you through creating your first group, adding a few sections, and inviting the people you live or plan with. The person who creates the group becomes an admin and stays in control.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">1</span>
                            <h3 className="text-sm font-semibold text-gray-900">Create your group space</h3>
                            <p className="text-xs text-gray-600">Give it a name like "PG flatmates", "Family home" or "Goa trip". You&apos;ll get a unique invite code and become the group admin.</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">2</span>
                            <h3 className="text-sm font-semibold text-gray-900">Add sections for what you share</h3>
                            <p className="text-xs text-gray-600">Start with a couple of sections – notes, lists, gallery or payments – for things like groceries, chores, itineraries, or shared costs.</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4 flex flex-col gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">3</span>
                            <h3 className="text-sm font-semibold text-gray-900">Invite your people &amp; stay in sync</h3>
                            <p className="text-xs text-gray-600">Share the invite code or send email invites. Admins approve join requests, manage members and sections; everyone else just adds items and checks what&apos;s due.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 text-xs text-gray-600">
                        <div className="rounded-xl bg-white border border-gray-100 p-4">
                            <p className="text-[11px] font-semibold text-gray-900 mb-1">Admins can…</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Create, rename and delete groups and sections</li>
                                <li>Invite people by code or email and remove members</li>
                                <li>Approve or reject join requests</li>
                                <li>Keep the workspace tidy and up to date</li>
                            </ul>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4">
                            <p className="text-[11px] font-semibold text-gray-900 mb-1">Members can…</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Add notes, checklist items, photos and payments</li>
                                <li>See what&apos;s decided, what&apos;s due and what&apos;s paid</li>
                                <li>Use FRYLY as the one place to come back to, instead of hunting in old chats</li>
                            </ul>
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
                            FRYLY sits next to WhatsApp or iMessage. Chats are for talking; FRYLY is for the things you don&apos;t want to lose – packing lists, house rules, vacation plans, loaned items, important dates and more.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Families</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Flatmates</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Travel groups</span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Close teams</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="rounded-3xl border border-gray-200 bg-gray-50/80 px-4 py-4 sm:py-5 space-y-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-1">Real groups using FRYLY</p>
                            <div className="grid gap-3 sm:grid-cols-2 text-[11px] text-gray-700">
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">PG / shared flat</p>
                                    <p>One group for everyone in the PG, with sections for groceries, cleaning duties, maintenance issues and monthly rent splits.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">Families</p>
                                    <p>A "Home base" group with school schedules, house rules, important contacts, medicine notes and recurring chores.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">Trip &amp; travel groups</p>
                                    <p>Friends planning a trip keep flights, stay options, packing lists, photos and who-paid-what in one shared space.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">Side projects &amp; small teams</p>
                                    <p>Lightweight spaces for ideas, simple task lists, reference notes and shared files – without heavy project tools.</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                If your group keeps saying "pin this" or "remember this later" in chat, it probably belongs in FRYLY.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
