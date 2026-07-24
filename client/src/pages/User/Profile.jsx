import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, KeyRound, Eye, EyeOff, Camera } from 'lucide-react';
import { getProfile, updateProfile, changePassword } from '../../api/userApi.js';
import { updateProfileSuccess, logout } from '../../redux/authSlice.js';
import Loader from '../../components/Loader.jsx';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    watch: watchPwd,
    reset: resetPwdForm,
    formState: { errors: pwdErrors },
  } = useForm();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        if (res.success) {
          setValue('name', res.data.name);
          setValue('phoneNumber', res.data.phoneNumber || '');
          setValue('gender', res.data.gender || '');
        }
      } catch (err) {
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setValue]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setUpdating(true);
    if (avatarFile) setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('gender', data.gender);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await updateProfile(formData);
      if (res.success) {
        dispatch(updateProfileSuccess(res.data));
        setAvatarFile(null);
        toast.success('Profile details updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
      setUploadingAvatar(false);
    }
  };

  const onChangePassword = async (data) => {
    setChangingPassword(true);
    try {
      const res = await changePassword(data.currentPassword, data.newPassword);
      if (res.success) {
        toast.success('Password changed successfully. Please log in again.');
        resetPwdForm();
        dispatch(logout());
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-[#2a1a12]">Settings</h1>
        <p className="text-[#6b5c54] text-sm">Manage your profile details and account security.</p>
      </div>

      {/* -- Profile details -- */}
      <div className="bg-white p-8 rounded-2xl border border-[#eaddd5]/40 shadow-sm">
        <h2 className="text-lg font-bold text-[#2a1a12] mb-6">Profile Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#fdece6] border-2 border-[#eaddd5] shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#e6472d] font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <label
                htmlFor="avatarInput"
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Camera size={18} className="text-white" />
              </label>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="avatarInput"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fdece6] hover:bg-[#fbe0d6] text-[#e6472d] text-xs font-bold rounded-lg cursor-pointer transition-colors w-fit"
              >
                <Camera size={14} /> Change Photo
              </label>
              <p className="text-[10px] text-[#9c8b83]">JPG or PNG, up to 5MB. Save changes to apply.</p>
              {uploadingAvatar && <p className="text-[10px] text-[#e6472d] font-semibold">Uploading photo…</p>}
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#6b5c54]">Email Address (Primary Identity)</label>
            <div className="relative">
              <input
                type="text"
                value={user?.email}
                disabled
                className="w-full pl-4 pr-4 py-3 bg-[#fdf4f0] border border-[#eaddd5] text-sm text-[#9c8b83] rounded-xl outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full pl-4 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-[#ba1a1a] font-semibold">{errors.name.message}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">Emergency Phone</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('phoneNumber')}
                  className="w-full pl-4 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-semibold text-[#6b5c54]">Gender</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all cursor-pointer"
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
            disabled={updating}
            className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:bg-[#e6472d]/50 active:scale-98 text-white font-bold rounded-xl shadow-md shadow-[#e6472d]/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {updating ? <Loader size="sm" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* -- Change Password -- */}
      <div className="bg-white p-8 rounded-2xl border border-[#eaddd5]/40 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <KeyRound size={18} className="text-[#e6472d]" />
          <h2 className="text-lg font-bold text-[#2a1a12]">Change Password</h2>
        </div>

        <form onSubmit={handlePwdSubmit(onChangePassword)} className="flex flex-col gap-4">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#6b5c54]">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                autoComplete="current-password"
                {...registerPwd('currentPassword', { required: 'Current password is required' })}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
              >
                {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwdErrors.currentPassword && (
              <span className="text-xs text-[#ba1a1a] font-semibold">{pwdErrors.currentPassword.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">New Password</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...registerPwd('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                  })}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
                >
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwdErrors.newPassword && (
                <span className="text-xs text-[#ba1a1a] font-semibold">{pwdErrors.newPassword.message}</span>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...registerPwd('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === watchPwd('newPassword') || 'Passwords do not match',
                  })}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
                >
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwdErrors.confirmPassword && (
                <span className="text-xs text-[#ba1a1a] font-semibold">{pwdErrors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-[#9c8b83]">
            You'll be logged out on all devices after changing your password, and will need to log in again with the new one.
          </p>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-3.5 bg-[#2a1a12] hover:bg-[#2a1a12]/90 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {changingPassword ? <Loader size="sm" /> : <><KeyRound size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
