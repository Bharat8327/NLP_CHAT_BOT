import { Navigate, Outlet } from 'react-router-dom';

const AuthRoute = () => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  
  if (token) {
    // If the user already has a token, they belong in the chat, not the login screen!
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />; // Render the login/signup child components safely
};

export default AuthRoute;
