import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader.jsx';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loader fullPage={true} />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace={true} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to general dashboard entry
    return <Navigate to="/dashboard" replace={true} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
