import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    const handleProfile = () => {
        navigate('/profile');
        setMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <>
            <header className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to={user ? "/dashboard" : "/"} className="lowercase text-2xl font-[Inter] font-extrabold text-blue-600 flex items-center tracking-tight">
                                <img src="/teamwork.png" alt="Fryly logo" className="h-7 w-7 mr-2" />
                                Fryly
                            </Link>
                        </div>
                        <nav className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-3" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowInfo(true)}
                                    className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    aria-label="About fryly"
                                >
                                    <Info size={16} />
                                </button>
                                <NotificationBell />
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {user?.pfpUrl ? (
                                        <img
                                            src={user.pfpUrl}
                                            alt={user.firstName || user.email || 'User avatar'}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span>
                                            {(user.firstName && user.firstName[0]?.toUpperCase())
                                                || (user.email && user.email[0]?.toUpperCase())
                                                || '?'}
                                        </span>
                                    )}
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-4 top-12 w-44 bg-white shadow-lg rounded-md border border-gray-100 py-1 text-sm z-50">
                                        <button
                                            type="button"
                                            onClick={handleProfile}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowInfo(true)}
                                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <Info size={14} />
                                    <span>How fryly works</span>
                                </button>
                                <Link to="/login" className="text-gray-500 hover:text-gray-900 font-medium transition">Login</Link>
                                <Link
                                    to="/register"
                                    className="ml-4 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                        </nav>
                    </div>
                </div>
            </header>
            {showInfo && (
                <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-8 overflow-y-auto no-scrollbar">
                    <div className="bg-white/95 rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-100 p-6 sm:p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="min-w-0">
                                <p className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[11px] font-medium text-blue-700 border border-blue-100 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Fryly guide
                                </p>
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">How fryly works</h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    A shared home base for the people you live and plan with \\u2013 notes, checklists, files, reminders, calendar and expenses in one place.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInfo(false)}
                                className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
                            >
                                Close
                            </button>
                        </div>
                        <div className="grid gap-5 sm:gap-6 text-sm text-gray-800 leading-relaxed">
                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/80">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-2">1. Core idea</h3>
                                <p className="text-sm text-gray-700">
                                    Fryly is built for real everyday groups you keep coming back to: your flat, your family, your regular crew.
                                    Instead of juggling WhatsApp chats, spreadsheets and random notes, you keep everything in one place: a group
                                    with sections for different kinds of information.
                                </p>
                            </section>

                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-2">2. Groups</h3>
                                <p className="text-sm text-gray-700 mb-3">
                                    Use a group for each circle in your life. For example: <span className="font-medium">Family</span>, <span className="font-medium">Flat 302</span>, <span className="font-medium">Side project</span>, or
                                    <span className="font-medium"> Trip to Goa</span>. Each group has its own members and its own set of sections.
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
                                    <li><span className="font-medium">Create a group</span> from the dashboard to get a blank workspace.</li>
                                    <li><span className="font-medium">Invite people</span> by sending them the group link or invite.</li>
                                    <li><span className="font-medium">Approve join requests</span> so only the right people can see what&apos;s inside.</li>
                                </ul>
                            </section>

                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-2">3. What to do after creating a group</h3>
                                <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                                    <li>Add 2–4 sections that match what this group needs (notes, lists, files, calendar, expenses, etc.).</li>
                                    <li>Write a short note at the top explaining what this group is for and how you want to use it.</li>
                                    <li>Invite the people who should be in this space, and approve them from the Manage group panel.</li>
                                    <li>Start using the sections during your actual conversations (for example: “I put the travel plan in the Trip note”).</li>
                                </ol>
                            </section>

                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-3">4. Section types</h3>
                                <p className="text-sm text-gray-700 mb-3">Inside each group you can mix and match different section types:</p>
                                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                                    <div className="space-y-1.5">
                                        <p className="font-medium">Notes</p>
                                        <p className="text-[13px] text-gray-600">Longer text, plans, meeting minutes, trip overviews and “how we do things” guides.</p>
                                        <p className="font-medium mt-2">Checklists</p>
                                        <p className="text-[13px] text-gray-600">Tasks and to-dos: packing lists, shopping lists, chores, launch checklists.</p>
                                        <p className="font-medium mt-2">Files (Gallery)</p>
                                        <p className="text-[13px] text-gray-600">Documents, IDs, tickets, photos and PDFs that everyone might need.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="font-medium">Reminders</p>
                                        <p className="text-[13px] text-gray-600">One-off or recurring reminders (rent due, bills, renewals, birthdays).</p>
                                        <p className="font-medium mt-2">Calendar</p>
                                        <p className="text-[13px] text-gray-600">Trips, important dates, events and who is going — with upcoming and past views.</p>
                                        <p className="font-medium mt-2">Expenses</p>
                                        <p className="text-[13px] text-gray-600">Track shared costs for trips, flats or small teams.</p>
                                        <p className="font-medium mt-2">Folders</p>
                                        <p className="text-[13px] text-gray-600">Group related sections together (for example: “House”, “Kids”, “Work” inside a Family group).</p>
                                    </div>
                                </div>
                            </section>

                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-2">5. Joining an existing group</h3>
                                <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                                    <li>Ask a member to share the group link or invite with you.</li>
                                    <li>Open the link and request to join the group.</li>
                                    <li>Once an admin approves you, you&apos;ll see all sections you have access to in the dashboard.</li>
                                </ol>
                            </section>

                            <section className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/80">
                                <h3 className="text-[13px] font-semibold text-gray-900 mb-2">6. Tips for using fryly day-to-day</h3>
                                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
                                    <li>Keep one group per real-world group. Don&apos;t mix unrelated things in the same place.</li>
                                    <li>Prefer one shared checklist instead of sending the same list in chat again and again.</li>
                                    <li>Put “source of truth” info in notes or files (not only in messages).</li>
                                    <li>Use the calendar and reminders so everyone can see what&apos;s coming up without asking.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
