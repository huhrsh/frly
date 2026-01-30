import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route } from 'react-router-dom';
import PublicRoute from './components/PublicRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import JoinGroup from './pages/JoinGroup';
import GroupView from './pages/GroupView';
import SectionView from './pages/SectionView';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          {/* Dashboard is protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/join"
            element={
              <ProtectedRoute>
                <JoinGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/sections/:sectionId"
            element={
              <ProtectedRoute>
                <SectionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
