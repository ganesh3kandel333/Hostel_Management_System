import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Bed,
  FileSpreadsheet,
  Users,
  AlertTriangle,
  User,
  Home,
  BarChart3,
  UsersRound,
  Plus,
  Settings,
  LogOut,
  Images
} from 'lucide-react';
import { logout } from '../redux/authSlice.js';
import { logoutUser } from '../api/authApi.js';
import { getMyBookings } from '../api/bookingApi.js';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Hostel admins already see their hostel's name in the sidebar (via
  // user.assignedHostel). Residents (students) had no equivalent — the
  // sidebar always just said "CzHostel" even once they were checked into a
  // hostel. Fetch their current approved booking so residents get the same
  // "which hostel am I in" context the admin gets.
  const [residentHostelName, setResidentHostelName] = useState(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyBookings();
        if (!cancelled && res.success) {
          const activeBooking = res.data.find((b) => b.status === 'approved');
          setResidentHostelName(activeBooking?.hostelId?.name || null);
        }
      } catch (err) {
        console.error('Failed to load resident hostel info:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (!user) return null;

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

  // Roles titles and subtitles. CzHostel is the overall platform — every
  // hostel_admin's account belongs to one specific hostel registered under
  // it, so their sidebar shows that hostel's own name rather than the
  // platform name, with the subtitle making the CzHostel affiliation clear.
  const sidebarHeader = {
    super_admin: { title: 'CzHostel', subtitle: 'Super Admin' },
    hostel_admin: { title: user.assignedHostel?.name || 'Unassigned Hostel', subtitle: 'CzHostel Partner' },
    student: { title: residentHostelName || 'CzHostel', subtitle: 'Resident Portal' },
  };

  const headerDetails = sidebarHeader[user.role] || { title: 'HostelHub', subtitle: 'System' };

  // Sidebar link categories based on roles
  const links = {
    super_admin: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/manage-users', label: 'Manage Users', icon: UsersRound },
      { path: '/manage-hostels', label: 'Manage Hostels', icon: Home },
      { path: '/landing-slider', label: 'Landing Slider', icon: Images },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/profile', label: 'Settings', icon: Settings },
    ],
    hostel_admin: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/my-hostel', label: 'My Hostel', icon: Home },
      { path: '/manage-rooms', label: 'Rooms', icon: Bed },
      { path: '/bookings', label: 'Bookings', icon: Users },
      { path: '/students', label: 'Residents', icon: UsersRound },
      { path: '/complaints', label: 'Complaints', icon: AlertTriangle },
      { path: '/profile', label: 'Settings', icon: Settings },
    ],
    student: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/hostels', label: 'Browse Hostels', icon: Home },
      { path: '/booking-status', label: 'My Booking', icon: Bed },
      { path: '/complaints', label: 'Complaints', icon: AlertTriangle },
      { path: '/profile', label: 'My Profile', icon: User },
    ],
  };

  const currentLinks = links[user.role] || [];

  const baseSidebar = (
    <aside className="w-64 h-full bg-[#F8341E] flex flex-col justify-between p-4">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="px-2 py-2 flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-[#FFD700] leading-tight">
            {headerDetails.title}
          </span>
          <span className="text-[10px] font-bold text-yellow/70 uppercase tracking-wider mt-0.5">
            {headerDetails.subtitle}
          </span>
        </div>

        {/* Navigation links — pill style like the mockup drawer */}
        <nav className="flex flex-col gap-3">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold transition-all shadow-sm ${
                    isActive
                      ? 'bg-[#e6472d] text-white shadow-md'
                      : 'bg-white text-[#6b5c54] hover:bg-[#fffff]'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Conditional "New Booking" button for Hostel Admin */}
        {user.role === 'hostel_admin' && (
          <div className="px-1 mt-1">
            <button
              onClick={() => {
                onClose();
                navigate('/manage-rooms');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2a1a12] hover:bg-black text-white font-bold text-xs rounded-full shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} /> New Booking
            </button>
          </div>
        )}
         <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold bg-white text-[#ba1a1a] hover:bg-[#ffdad6] transition-all text-left cursor-pointer"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

    
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block h-[calc(100vh-73px)] shrink-0">
        {baseSidebar}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer container */}
          <div className="relative flex w-64 max-w-xs flex-col bg-[#F8341E] animate-fade-in">
            {baseSidebar}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
