import React, { useState } from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
  import { useSelector } from 'react-redux';
  import { ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

  import Home from './pages/Home.jsx';
  import Login from './pages/Login.jsx';
  import Register from './pages/Register.jsx';
  // import ForgotPassword from './pages/ForgotPassword.jsx';
  // import ResetPassword from './pages/ResetPassword.jsx';
  import Dashboard from './pages/Dashboard.jsx';
  import Profile from './pages/User/Profile.jsx';
  import Complaints from './pages/Complaints.jsx';
  
  // Student pages
  import BrowseHostels from './pages/User/BrowseHostels.jsx';
  import BookRoom from './pages/User/BookRoom.jsx';
  import BookingStatus from './pages/User/BookingStatus.jsx';

  // Warden pages
  import ManageRooms from './pages/HostelAdmin/ManageRooms.jsx';
  import BookingRequests from './pages/HostelAdmin/BookingRequests.jsx';
  import StudentsList from './pages/HostelAdmin/Students.jsx';

  // Super Admin pages
  import ManageUsers from './pages/SuperAdmin/ManageUsers.jsx';
  import ManageHostels from './pages/SuperAdmin/ManageHostels.jsx';
  import ManageHeroSlides from './pages/SuperAdmin/ManageHeroSlides.jsx';
  import Reports from './pages/SuperAdmin/Reports.jsx';

  // Layout components
  import Navbar from './components/Navbar.jsx';
  import Sidebar from './components/Sidebar.jsx';
  import Footer from './components/Footer.jsx';
  import ProtectedRoute from './components/ProtectedRoute.jsx';

  const AppContent = () => {
    const { token } = useSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    // When Home links to /login or /register, it passes state={{ background: location }}.
    // That lets us render the page the person came from (Home) underneath, and the
    // auth form as a blurred overlay on top of it — a real modal, not a fake screenshot.
    const background = location.state?.background;

    if (!token) {
      return (
        <div className="min-h-screen bg-white flex flex-col justify-between">
          <div className="flex-1">
            <Routes location={background || location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} /> */}
              <Route path="*" element={<Navigate to="/" replace={true} />} />
            </Routes>
          </div>
          <Footer />

          {/* Modal overlay: only rendered when we arrived here from Home via a Link
              carrying background state, so Home is still mounted behind it. */}
          {background && (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-white p-4 lg:p-8">
            <Routes>
              {/* Common protected routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* Shared: both students and hostel admins use /complaints, the
                  Complaints wrapper picks the right view internally */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'hostel_admin']} />}>
                <Route path="/complaints" element={<Complaints />} />
              </Route>

              {/* Student only routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/hostels" element={<BrowseHostels />} />
                <Route path="/book-room" element={<BookRoom />} />
                <Route path="/booking-status" element={<BookingStatus />} />
              </Route>

              {/* Hostel Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['hostel_admin']} />}>
                <Route path="/my-hostel" element={<ManageHostels />} />
                <Route path="/manage-rooms" element={<ManageRooms />} />
                <Route path="/bookings" element={<BookingRequests />} />
                <Route path="/students" element={<StudentsList />} />
              </Route>

              {/* Super Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/manage-hostels" element={<ManageHostels />} />
                <Route path="/landing-slider" element={<ManageHeroSlides />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace={true} />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    );
  };

  const App = () => {
    return (
      <Router>
        <AppContent />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={true}
          pauseOnHover={true}
          theme="dark"
        />
      </Router>
    );
  };

  export default App;
