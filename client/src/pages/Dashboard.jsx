import React from 'react';
import { useSelector } from 'react-redux';
import StudentDashboard from './User/Dashboard.jsx';
import HostelAdminDashboard from './HostelAdmin/Dashboard.jsx';
import SuperAdminDashboard from './SuperAdmin/Dashboard.jsx';
import Loader from '../components/Loader.jsx';

const Dashboard = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loader fullPage={true} />;
  }

  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  if (user?.role === 'hostel_admin') {
    return <HostelAdminDashboard />;
  }
  
  // Default to Student/Resident Dashboard
  return <StudentDashboard />;
};

export default Dashboard;
