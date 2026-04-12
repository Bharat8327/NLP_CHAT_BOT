import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axiosInstance';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      toast.error('Session lost. Please log in or register again.');
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/verify-otp', { email, otp });
      toast.success('Account successfully verified!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-green-500/20 text-green-400 items-center justify-center text-3xl mb-4">
          ✉️
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Check Your Email</h2>
        <p className="text-white/50 text-sm mb-6">
          We sent a 6-digit verification code to <strong>{email}</strong>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              required
              maxLength={6}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl bg-black/40 border border-white/10 rounded-xl h-14 px-4 text-white placeholder-white/20 outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
