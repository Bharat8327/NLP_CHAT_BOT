import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axiosInstance';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) return toast.error('Password must be 8+ characters');
    setLoading(true);

    try {
      await api.post('/api/auth/register', formData);
      toast.success('Registration successful! Please check your email for the OTP.');
      // Pass email to VerifyOTP page via router state
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 mb-4">
            AI
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account</h2>
          <p className="text-white/50 text-sm">Join the future of conversational AI</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Password</label>
            <input
              type="password"
              placeholder="Create a password (min 8 chars)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
          
          <div className="text-center pt-4 text-sm text-white/50">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
