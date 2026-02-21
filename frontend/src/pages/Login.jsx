import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";

    const handleForgotPassword = async () => {
        if (!email) {
            toast.info('Please enter your email first.');
            return;
        }
        try {
            await axiosClient.post('/auth/forgot-password', { email });
            toast.success('If an account exists, a reset email has been sent.');
        } catch (error) {
            console.error('Failed to send reset email', error);
            toast.error('Failed to send reset email. Please try again later.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
        }
    };

        return (
		<div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4 py-4 sm:py-8">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="hidden lg:block">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-8 py-10 space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Welcome back to <span className="text-blue-600">FRYLY</span>
                        </h1>
                        <p className="text-sm text-gray-700 max-w-md">
                            Jump straight into your shared spaces, notes, lists and reminders. Everything in your groups stays organised and secure.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Instant access to all your groups</li>
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Secure, invite-only collaboration</li>
                            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Sections for notes, lists, gallery & more</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-8">
                    <h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-900 text-center">
                        Sign in to your account
                    </h2>
                    <p className="mt-1 text-xs text-center text-slate-500">Use the email you registered with to access all your groups.</p>

                    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="font-semibold text-blue-600 hover:text-blue-500 text-xs"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-3"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        New here?{' '}
                        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
