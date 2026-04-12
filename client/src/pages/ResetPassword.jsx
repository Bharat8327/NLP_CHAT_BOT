import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axiosInstance';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Minimum 8 characters');
    setLoading(true);

    try {
      await api.put(`/api/auth/resetpassword/${token}`, { password });
      toast.success('Password successfully reset. You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Token expired or invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 items-center justify-center text-3xl mb-4">
          🛡️
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Create New Password</h2>
        <p className="text-white/50 text-sm mb-6">
          Your new password must be at least 8 characters long securely.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
