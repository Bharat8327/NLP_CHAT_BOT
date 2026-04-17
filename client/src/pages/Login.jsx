import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomInput from '../components/CustomInput.jsx';
import api from '../lib/axiosInstance';
import toast from 'react-hot-toast';

import useChatStore from '../store/chatStore';
import useAuthStore from '../store/useAuthStore';

import {
  CustomCard,
  CustomCardContent,
  CustomCardDescription,
  CustomCardHeader,
  CustomCardTitle,
} from '../components/CustomCard.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password, rememberMe });
      
      // Store token based on remember me preference
      if (rememberMe) {
        localStorage.setItem('accessToken', data.accessToken);
      } else {
        sessionStorage.setItem('accessToken', data.accessToken);
      }

      // Store CSRF token for future state-changing requests (DELETE, POST, etc.)
      useAuthStore.getState().setCsrfToken(data.csrfToken);

      // Natively trigger global auth checks and fetch specific cloud chats without a hard reload!
      await checkAuth();
      await useChatStore.getState().fetchCloudChats();
      
      toast.success(`Welcome back, ${data.user.name}`);
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex w-full max-w-5xl gap-8 items-center relative z-10">
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/2">
          <div className="w-full max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
                AI
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
              <p className="text-white/50 text-sm">Sign in to your Antigravity NLP account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-white/70">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl h-12 pl-4 pr-12 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.57c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-offset-0 focus:ring-0 cursor-pointer" 
                  />
                  <span className="text-xs text-white/60">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="text-center pt-4 text-sm text-white/50">
                Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Hero Content */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center text-center space-y-8 pl-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Pro Features Included
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Antigravity NLP
            </h1>
            <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed">
              Experience the future of AI conversation. Your ultimate suite for speech recognition, multi-lingual TTS, and 3D Avatar responses.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-left hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 text-xl">🚀</div>
              <h3 className="font-semibold text-white/90 mb-1 text-sm">Ultra Fast</h3>
              <p className="text-xs text-white/50 leading-relaxed">Streaming API generates answers in milliseconds.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-left hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3 text-xl">🎙️</div>
              <h3 className="font-semibold text-white/90 mb-1 text-sm">Native Voice</h3>
              <p className="text-xs text-white/50 leading-relaxed">Cross language text-to-speech built in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
