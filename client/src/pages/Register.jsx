import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, X, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { registerUser } from '../api/authApi.js';
import Loader from '../components/Loader.jsx';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const isModal = Boolean(location.state?.background);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const closeModal = () => navigate(-1);

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
    if (data.gender) formData.append('gender', data.gender);
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const res = await registerUser(formData);
      if (res.success) {
        toast.success(res.message || 'Registration successful! You can now log in.');
        navigate('/login', isModal ? { state: { background: location.state.background } } : undefined);
      } else {
        toast.error(res.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className="bg-white border border-[#eaddd5]/40 w-full max-w-lg p-9 rounded-[2rem] shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
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

      <h2 className="text-3xl font-extrabold text-[#2a1a12] text-center mb-2">Create Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6b5c54]">Full Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full pl-5 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
            />
            {errors.name && (
              <span className="text-xs text-[#ba1a1a] font-semibold">{errors.name.message}</span>
            )}
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6b5c54]">Email Address</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full pl-5 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
            />
            {errors.email && (
              <span className="text-xs text-[#ba1a1a] font-semibold">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6b5c54]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="w-full pl-5 pr-10 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-[#ba1a1a] font-semibold">{errors.password.message}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6b5c54]">Phone Number</label>
            <input
              type="text"
              {...register('phoneNumber')}
              className="w-full pl-5 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-full text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all shadow-sm"
            />
          </div>

          {/* Gender Select */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-[#6b5c54]">Gender</label>
            <select
              {...register('gender', { required: 'Gender is required' })}
              className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all shadow-sm"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <span className="text-xs text-[#ba1a1a] font-semibold">{errors.gender.message}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:bg-[#e6472d]/50 active:scale-98 text-white font-bold rounded-full shadow-md shadow-[#e6472d]/10 transition-all flex items-center justify-center cursor-pointer mt-2"
        >
          {loading ? <Loader size="sm" /> : 'Register'}
        </button>
      </form>

      <p className="text-sm text-[#6b5c54] text-center mt-8">
        Already have an account?{' '}
        <Link
          to="/login"
          state={isModal ? { background: location.state.background } : undefined}
          className="text-[#e6472d] hover:text-[#ff7a54] font-bold"
        >
          Sign In here
        </Link>
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
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

export default Register;
