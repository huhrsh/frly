import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                        Organize your life, together.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Share notes, lists, galleries, and reminders with your groups. Frly makes collaboration simple and beautiful.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/register"
                            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                        >
                            Get started
                        </Link>
                        <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                            Log in <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="font-semibold text-gray-900">Shared Notes</h3>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="text-4xl mb-4">✅</div>
                        <h3 className="font-semibold text-gray-900">Collaborative Lists</h3>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="text-4xl mb-4">📸</div>
                        <h3 className="font-semibold text-gray-900">Photo Galleries</h3>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="text-4xl mb-4">⏰</div>
                        <h3 className="font-semibold text-gray-900">Group Reminders</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
