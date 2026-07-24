import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, LogOut, User as UserIcon, Menu, X, Check, ChevronLeft } from 'lucide-react';
import { logout } from '../redux/authSlice.js';
import { logoutUser } from '../api/authApi.js';
import { getMyNotifications, markNotificationAsRead, markAllAsRead } from '../api/notificationApi.js';
import { toast } from 'react-toastify';
import logo from "../assets/logo.jpeg";

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/dashboard';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 45s
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifications(false);
    
    // Redirect contextually based on notification type
    if (notif.type === 'booking') navigate('/bookings');
    if (notif.type === 'complaint') navigate('/complaints');
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-40 w-full px-4 py-2.5 flex items-center justify-between border-b border-[#eaddd5]/30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Toggle sidebar button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-lg lg:hidden cursor-pointer transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Back button — shown on every page except the dashboard home */}
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-lg cursor-pointer transition-colors text-xs font-bold"
          >
            <ChevronLeft size={18} /> Back
          </button>
        )}

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#e6472d] flex items-center justify-center font-bold text-white shadow-lg shadow-[#e6472d]/20">
                       <img
              src={logo}
              alt="CzHostel Logo"
              className="w-10 h-10 object-cover rounded-xl"
            />
          </div>
           <div className="flex flex-col leading-none gap-[3px]">
              <span className="font-black text-[14px] tracking-tight text-[#e6472d]">
                CzHostel
              </span>
              
            </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-xl transition-all cursor-pointer"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-[#ff7a54] rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
 
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-[#eaddd5]/40 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-[#eaddd5]/30 flex items-center justify-between">
                <span className="font-bold text-[#2a1a12] text-sm">Alert Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#e6472d] hover:text-[#ff7a54] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#9c8b83]">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b border-[#eaddd5]/20 hover:bg-[#fdece6]/40 cursor-pointer transition-all ${
                        !n.isRead ? 'bg-[#e6472d]/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-extrabold uppercase ${
                          n.type === 'booking' ? 'text-[#ff7a54]' :
                          n.type === 'complaint' ? 'text-[#872d00]' : 'text-emerald-600'
                        }`}>
                          {n.type}
                        </span>
                        <span className="text-[10px] text-[#9c8b83]">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs ${!n.isRead ? 'font-bold text-[#2a1a12]' : 'text-[#6b5c54]'}`}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
 
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 text-left rounded-xl hover:bg-[#fdece6] transition-all cursor-pointer"
          >
            <img
              src={user?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1631234567/default_avatar.png'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#e6472d]/50"
            />
            <div className="hidden md:block pr-2">
              <p className="text-xs font-bold text-[#2a1a12]">{user?.name}</p>
              <p className="text-[10px] text-[#9c8b83] capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </button>
 
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-[#eaddd5]/40 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-[#eaddd5]/30">
                <p className="text-sm font-bold text-[#2a1a12] truncate">{user?.name}</p>
                <p className="text-xs text-[#9c8b83] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#6b5c54] hover:text-[#e6472d] hover:bg-[#fdece6]/50 transition-all font-semibold"
                >
                  <UserIcon size={16} />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-all font-semibold text-left cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
