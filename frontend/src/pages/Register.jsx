import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(firstName, lastName, email, password);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error('Registration failed. Please try again.');
        }
    };

        return (
		<div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4 py-4 sm:py-8">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Join <span className="text-blue-600">FRYLY</span>
                        </h1>
                        <p className="text-sm text-gray-700 max-w-md">
                            Create an account to start or join shared spaces for your teams, projects, and personal workflows.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Organise notes, lists, galleries and reminders</li>
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Invite-only access with join approvals</li>
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Perfect for teams, families and side projects</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8">
                    <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
                        Create your account
                    </h2>
                    <p className="mt-1 text-xs text-center text-slate-500">We just need a few details to get you started.</p>

                    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900">First Name</label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900">Last Name</label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email address</label>
                            <div className="mt-2">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
                            <div className="mt-2">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                            >
                                Sign up
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
