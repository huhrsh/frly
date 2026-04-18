import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyFontPreference = (preference) => {
        if (typeof document === 'undefined') return;
        const scale = preference || 'normal';
        let size = '15px'; // default
        if (scale === 'small') size = '14px';
        if (scale === 'large') size = '17px';
        if (scale === 'xlarge') size = '19px';
        document.documentElement.style.fontSize = size;
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && token !== 'undefined') {
            if (storedUser && storedUser !== 'undefined') {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    if (parsed.fontPreference) {
                        applyFontPreference(parsed.fontPreference);
                    }
                } catch (e) {
                    console.error('Failed to parse stored user, falling back to token only', e);
                    setUser({ token });
                }
            } else {
                setUser({ token });
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Show a one-time message if a previous request triggered an auth-expired logout
        if (typeof window === 'undefined') return;
        try {
            const flag = sessionStorage.getItem('authExpired');
            if (flag === '1') {
                sessionStorage.removeItem('authExpired');
                toast.error('Your session expired. Please sign in again.');
            }
        } catch {
            // ignore storage issues
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            const token = response.data.accessToken;
            const userData = response.data.userDto;

            // Preserve any locally stored font preference
            const storedFont = localStorage.getItem('fontPreference');
            if (storedFont) {
                userData.fontPreference = storedFont;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            applyFontPreference(userData.fontPreference);
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const register = async (firstName, lastName, email, password) => {
        try {
            await axiosClient.post('/users', { firstName, lastName, email, password});
            return true;
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const googleLogin = async (idToken) => {
        try {
            const response = await axiosClient.post('/auth/google', { idToken });
            const token = response.data.accessToken;
            const userData = response.data.userDto;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            applyFontPreference(userData.fontPreference);
            return true;
        } catch (error) {
            console.error("Google login failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentGroupId');
        localStorage.removeItem('fontPreference');
        setUser(null);
    };

    const updateUser = (partial) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...(partial || {}) };
            if (next.fontPreference) {
                localStorage.setItem('fontPreference', next.fontPreference);
                applyFontPreference(next.fontPreference);
            }
            // Always persist the latest user details so header/avatar stay in sync
            localStorage.setItem('user', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        // Apply a default or stored font preference on first load
        if (!user) {
            const stored = localStorage.getItem('fontPreference');
            if (stored) {
                applyFontPreference(stored);
            }
            return;
        }
        if (user.fontPreference) {
            applyFontPreference(user.fontPreference);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
