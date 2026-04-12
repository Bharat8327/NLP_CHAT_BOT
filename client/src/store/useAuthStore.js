import { create } from 'zustand';
import api from '../lib/axiosInstance';
import toast from 'react-hot-toast';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const { data } = await api.get('/api/auth/profile');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  logout: async (navigate) => {
    try {
      // Safely revoke via Backend API
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout API failed but cleaning local footprint');
    } finally {
      // Nuke local tracks regardless of API success
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false });
      
      // Wipe the Chat memory footprint!
      localStorage.removeItem('nlp-chatbot-store');
      
      toast.success('Securely logged out');
      if (navigate) navigate('/');
    }
  }
}));

export default useAuthStore;
