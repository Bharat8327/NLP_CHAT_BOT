import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axiosInstance';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgotpassword', { email });
      setSent(true);
      toast.success('Password reset link sent securely to your email.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-red-500/20 text-red-400 items-center justify-center text-3xl mb-4">
          🔐
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Forgot Password</h2>
        <p className="text-white/50 text-sm mb-6">
          Enter your registered email address and we will send you a reset link.
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80">
            If an account exists for <strong>{email}</strong>, you will receive a secure password reset link shortly.
          </div>
        )}

        <div className="mt-6 text-sm text-white/50">
          Remember it? <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
