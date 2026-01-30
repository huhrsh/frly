import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
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
        <header className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to={user ? "/dashboard" : "/"} className="text-2xl font-extrabold text-blue-600 tracking-tight">
                            FRYLY
                        </Link>
                    </div>
                    <nav className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-3" ref={menuRef}>
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
                                            Update profile
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
    );
};

export default Header;
