import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, X, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { loginUser } from '../api/authApi.js';
import { authStart, authSuccess, authFailure } from '../redux/authSlice.js';
import Loader from '../components/Loader.jsx';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  // Rendered as a modal (blurred backdrop, X to close) only when we arrived here
  // via a Link from Home that attached background state. Typing /login directly
  // falls back to a plain full-page form.
  const isModal = Boolean(location.state?.background);

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const closeModal = () => navigate(-1);

  const onSubmit = async (data) => {
    dispatch(authStart());
    try {
      const res = await loginUser(data);
      if (res.success) {
        dispatch(authSuccess(res.data));
        toast.success(res.message || 'Login successful!');
        navigate('/dashboard');
      } else {
        dispatch(authFailure(res.message));
        toast.error(res.message || 'Login failed');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Invalid credentials';
      dispatch(authFailure(errMsg));
      toast.error(errMsg);
    }
  };

  const card = (
    <div className="bg-white border border-[#eaddd5]/40 w-full max-w-md p-9 rounded-[2rem] shadow-2xl relative z-10">
      {isModal && (
        <button
          onClick={closeModal}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#fdece6] hover:bg-[#fbe0d6] text-[#e6472d] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      )}

      {!isModal && (
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#e6472d] hover:underline mb-4 w-fit"
        >
          <ChevronLeft size={14} /> Back to Home
        </Link>
      )}

      <h2 className="text-3xl font-extrabold text-[#2a1a12] text-center mb-2">Welcome Back</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
        {/* Email field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#6b5c54]">Email Address</label>
          <div className="relative">
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full pl-5 pr-4 py-3 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
            />
          </div>
          {errors.email && (
            <span className="text-xs text-[#ba1a1a] font-semibold">{errors.email.message}</span>
          )}
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#6b5c54]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              className="w-full pl-5 pr-10 py-3 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-[#ba1a1a] font-semibold">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:bg-[#e6472d]/50 active:scale-98 text-white font-bold rounded-full shadow-md shadow-[#e6472d]/10 transition-all flex items-center justify-center cursor-pointer mt-2"
        >
          {loading ? <Loader size="sm" /> : 'Sign In'}
        </button>
      </form>

      <p className="text-sm text-[#6b5c54] text-center mt-8">
        Don't have an account?{' '}
        <Link
          to="/register"
          state={isModal ? { background: location.state.background } : undefined}
          className="text-[#e6472d] hover:text-[#ff7a54] font-bold"
        >
          Register here
        </Link>
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
        {/* Blurred backdrop over the still-mounted landing page */}
        <div
          onClick={closeModal}
          className="fixed inset-0 bg-[#2a1a12]/40 backdrop-blur-md transition-opacity"
        />
        {card}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf8f5] px-6 py-12">
      {card}
    </div>
  );
};

export default Login;
