import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Render the child components securely
};

export default ProtectedRoute;
