import React, { lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route } from 'react-router-dom';
import PublicRoute from './components/PublicRoute';
import ScrollToTop from './ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Features from './pages/Features';
import Integrations from './pages/Integrations';
import Pricing from './pages/Pricing';
import Changelog from './pages/Changelog';
import About from './pages/About';
import Careers from './pages/Careers';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';
import Review from './pages/Review';
import FAQ from './pages/FAQ';
import Guide from './pages/Guide';
import PageMeta from './components/PageMeta';
import { guides } from './seo';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GroupInvite = lazy(() => import('./pages/GroupInvite'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const GroupView = lazy(() => import('./pages/GroupView'));
const SectionView = lazy(() => import('./pages/SectionView'));
const Profile = lazy(() => import('./pages/Profile'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));

function App() {
  return (
	<div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <PageMeta />
  <OfflineBanner />
  <InstallPrompt />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <ScrollToTop />
        <Suspense fallback={<div className="py-12 text-center" role="status">Loading…</div>}><Routes>
          {guides.map(page => <Route key={page.path} path={page.path} element={<Guide page={page} />} />)}
          <Route path="*" element={<div className="max-w-3xl mx-auto py-12"><h1 className="text-3xl font-bold">Page not found</h1><a href="/" className="text-blue-700 underline">Return to Fryly</a></div>} />
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/group-invite"
            element={<GroupInvite />}
          />
          <Route path="/features" element={<Features />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/review" element={<Review />} />
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
          <Route
            path="/users/:userId"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            }
          />
        </Routes></Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
