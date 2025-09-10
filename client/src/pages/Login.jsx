import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomButton from '../components/CustomButton.jsx';
import CustomInput from '../components/CustomInput.jsx';

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
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-green-300 flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl gap-8 items-center">
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/2">
          <CustomCard className="w-full max-w-md mx-auto shadow-lg">
            <CustomCardHeader className="text-center">
              <CustomCardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </CustomCardTitle>
              <CustomCardDescription>
                Sign in to your chatbot account
              </CustomCardDescription>
            </CustomCardHeader>
            <CustomCardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <CustomInput
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2 relative">
                  <CustomInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 text-base"
                  />
                  <CustomButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-base hover:bg-gray-100"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </CustomButton>
                </div>
                <CustomButton
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Login
                </CustomButton>
              </form>
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:underline transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </div>
            </CustomCardContent>
          </CustomCard>
        </div>

        {/* Right side - Hero Content */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center text-center space-y-6 ">
          <div className="space-y-4">
            <h1 className="text-4xl  font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Assistant Premium
            </h1>
            <p className="text-xl bg-gradient-to-r from-pink-600 to-green-300 bg-clip-text text-transparent max-w-md">
              Experience the future of AI conversation with our advanced chatbot
              platform
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-900">Fast Responses</h3>
              <p className="text-sm text-gray-500">
                Lightning quick AI responses
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900">Secure</h3>
              <p className="text-sm text-gray-500">Enterprise-grade security</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">📁</div>
              <h3 className="font-semibold text-gray-900">File Support</h3>
              <p className="text-sm text-gray-500">Upload and analyze files</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900">Smart Chat</h3>
              <p className="text-sm text-gray-500">Contextual conversations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
