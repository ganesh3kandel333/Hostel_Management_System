import React from 'react';
import { useSelector } from 'react-redux';
import StudentComplaints from './User/Complaints.jsx';
import AdminComplaints from './HostelAdmin/Complaints.jsx';


const Complaints = () => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'hostel_admin') return <AdminComplaints />;
  return <StudentComplaints />;
};

export default Complaints;
