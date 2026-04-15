import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import useChatStore from './store/chatStore';
import './index.css';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VerifyOTP from './pages/VerifyOTP.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import HomePage from './pages/HomePgae.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthRoute from './components/AuthRoute.jsx';

// Lazy-loaded Avatar UI (heavy Three.js bundle)
const AvatarUI = lazy(() => import('./components/ChatInterfaces/AvatarUI.jsx'));

const App = () => {
  // Run auth check once on mount — no dependencies to prevent re-runs
  useEffect(() => {
    useAuthStore.getState().checkAuth().then((isAuth) => {
      if (isAuth) {
        useChatStore.getState().fetchCloudChats();
      }
    });
  }, []); // Empty deps — runs once. Using getState() avoids stale closure issues.

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 35, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            fontSize: '0.875rem',
            borderRadius: '12px',
          },
        }}
      />
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Public / Unauthenticated Only Routes */}
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<HomePage />} />
          </Route>

          {/* 404 catch-all — must be LAST */}
          <Route path="*" element={
            <div className="h-full flex items-center justify-center">
              <div className="text-center animate-fadeIn">
                <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                <p className="text-white/40 text-lg">Page not found</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </>
  );
};

export default App;
