import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && token !== 'undefined') {
            if (storedUser && storedUser !== 'undefined') {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
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

    const login = async (email, password) => {
        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            const token = response.data.accessToken;
            const userData = response.data.userDto;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
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

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentGroupId');
        setUser(null);
    };

    const updateUser = (partial) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...(partial || {}) };
            if (next.token) {
                localStorage.setItem('user', JSON.stringify(next));
            }
            return next;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
