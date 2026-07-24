import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Users, UserCheck, RefreshCw, Plus, X, Home, Edit2, Eye, EyeOff, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import {
  getAllUsers,
  createHostelAdmin,
  updateHostelAdmin,
  deleteUser,
  updateUserStatus,
  assignHostelToAdmin,
} from '../../api/userApi.js';
import { getAllHostels } from '../../api/hostelApi.js';
import Loader from '../../components/Loader.jsx';

const emptyAdminForm = { name: '', email: '', phoneNumber: '', gender: '', hostelId: '', password: '' };

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Hostel Admin modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState(emptyAdminForm);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Hostel Admin modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTargetUser, setEditTargetUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyAdminForm);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editing, setEditing] = useState(false);

  // Delete confirmation modal
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reassign hostel modal (for an existing hostel_admin)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetUser, setAssignTargetUser] = useState(null);
  const [assignHostelId, setAssignHostelId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchHostels = async () => {
    try {
      const res = await getAllHostels();
      if (res.success) setHostels(res.data);
    } catch (err) {
      toast.error('Failed to load hostels for assignment');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;

      const res = await getAllUsers(filters);
      if (res.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error('Failed to load user registers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce input searches
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchHostels();
  }, []);

  // Approving a pending hostel_admin still uses status (this is not "suspend",
  // it's the one-time activation step) — everything else uses delete now.
  const handleApprove = async (id) => {
    try {
      const res = await updateUserStatus(id, 'active');
      if (res.success) {
        toast.success('Hostel Admin approved and activated!');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve account');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!newAdmin.password || newAdmin.password.length < 6) {
      toast.error('A password of at least 6 characters is required');
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(newAdmin).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const res = await createHostelAdmin(formData);
      if (res.success) {
        toast.success(res.message || 'Hostel Admin created successfully!');
        setShowCreateModal(false);
        setNewAdmin(emptyAdminForm);
        setShowPassword(false);
        fetchUsers();
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create hostel admin');
    } finally {
      setCreating(false);
    }
  };

  const unassignedHostels = hostels.filter((h) => !h.admin);

  const handleOpenAssignModal = (user) => {
    setAssignTargetUser(user);
    setAssignHostelId(user.assignedHostel?._id || '');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!assignHostelId) {
      toast.error('Please select a hostel');
      return;
    }
    setAssigning(true);
    try {
      const res = await assignHostelToAdmin(assignTargetUser._id, assignHostelId);
      if (res.success) {
        toast.success(res.message || 'Hostel assignment updated successfully!');
        setShowAssignModal(false);
        fetchUsers();
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hostel assignment');
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditTargetUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || '',
      hostelId: '',
      password: '',
    });
    setShowEditPassword(false);
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setEditing(true);
    try {
      const formData = new FormData();
      ['name', 'email', 'phoneNumber', 'gender', 'password'].forEach((key) => {
        if (editForm[key]) formData.append(key, editForm[key]);
      });
      const res = await updateHostelAdmin(editTargetUser._id, formData);
      if (res.success) {
        toast.success(res.message || 'Hostel Admin updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hostel admin');
    } finally {
      setEditing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    setDeleting(true);
    try {
      const res = await deleteUser(deleteTargetUser._id);
      if (res.success) {
        toast.success(res.message || 'Account deleted permanently');
        setDeleteTargetUser(null);
        fetchUsers();
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">System User Accounts</h1>
          <p className="text-[#6b5c54] text-sm">Audit account registrations, manage hostel assignments, or remove access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} /> Create Hostel Admin
          </button>
          <button
            onClick={fetchUsers}
            className="p-2 text-[#9c8b83] hover:text-[#d84e32] hover:bg-[#fdece6] rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Create Hostel Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-[#9c8b83] hover:text-[#2a1a12] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-extrabold text-[#2a1a12] mb-1">Create Hostel Admin</h2>
           
            <form onSubmit={handleCreateAdmin} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Phone Number</label>
                <input
                  type="text"
                  value={newAdmin.phoneNumber}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Gender</label>
                <select
                  value={newAdmin.gender}
                  onChange={(e) => setNewAdmin({ ...newAdmin, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none cursor-pointer"
                >
                  <option value="">Select Gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">
                  Password <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#9c8b83]">
                  Required. This is also emailed to the admin along with their login email.
                </p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 text-white font-bold rounded-xl transition-all cursor-pointer mt-1"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hostel Admin Modal */}
      {showEditModal && editTargetUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-[#9c8b83] hover:text-[#2a1a12] cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[#fdece6] border border-[#d84e32]/20 flex items-center justify-center font-bold text-sm text-[#d84e32]">
                {editTargetUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#2a1a12] leading-tight">Edit Hostel Admin</h2>
                <p className="text-[11px] text-[#9c8b83]">{editTargetUser.email}</p>
              </div>
            </div>
            <p className="text-xs text-[#6b5c54] mb-5 mt-3">
              Update this Hostel Admin's account details. Leave the password field blank to keep their current password.
            </p>
            <form onSubmit={handleUpdateAdmin} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none cursor-pointer"
                >
                  <option value="">Select Gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">New Password (optional)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={6}
                    placeholder="Leave blank to keep current password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none placeholder:text-[#c9bcb4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9c8b83] hover:text-[#e6472d] cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={editing}
                className="w-full py-3 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 text-white font-bold rounded-xl transition-all cursor-pointer mt-1"
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-extrabold text-[#2a1a12] mb-1">Delete this account?</h2>
            <p className="text-xs text-[#6b5c54] mb-5 leading-relaxed">
              This will permanently delete <strong>{deleteTargetUser.name}</strong>'s (
              <span className="text-[#9c8b83]">{deleteTargetUser.email}</span>) account
              {deleteTargetUser.role === 'hostel_admin' ? ' and free up their assigned hostel' : ''}. This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 py-2.5 bg-white hover:bg-[#f7f5f4] text-[#2a1a12] border border-[#eaddd5] font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Reassign Hostel Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-[#9c8b83] hover:text-[#2a1a12] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-extrabold text-[#2a1a12] mb-1">Assign Hostel</h2>
            <p className="text-xs text-[#6b5c54] mb-5">
              Choose which hostel <strong>{assignTargetUser?.name}</strong> will manage. They'll only be able to view and update data for this hostel.
            </p>
            <form onSubmit={handleConfirmAssign} className="flex flex-col gap-3.5">
              <select
                value={assignHostelId}
                onChange={(e) => setAssignHostelId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm outline-none cursor-pointer"
              >
                <option value="">Select a hostel...</option>
                {hostels
                  .filter((h) => !h.admin || h.admin._id === assignTargetUser?._id)
                  .map((h) => (
                    <option key={h._id} value={h._id}>{h.name} - {h.city}</option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={assigning}
                className="w-full py-3 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 text-white font-bold rounded-xl transition-all cursor-pointer mt-1"
              >
                {assigning ? 'Saving...' : 'Save Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#eaddd5]/40 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-4 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-xs text-[#2a1a12] placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-xs text-[#2a1a12] outline-none cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="hostel_admin">Hostel Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-xs text-[#2a1a12] outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_approval">Pending Approval</option>
        </select>
      </div>

      {/* Users table */}
      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#eaddd5]/40 shadow-sm text-[#6b5c54] text-sm">
          No users found matching parameters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eaddd5]/45 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fdece6] text-[#2a1a12] text-xs font-bold uppercase tracking-wider border-b border-[#eaddd5]/40">
                  <th className="px-6 py-4">Account Name</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Assigned Hostel</th>
                  <th className="px-6 py-4">Registered Date</th>
                  
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd5]/30 text-sm">
                {users.map((u) => {
                  const isHostelAdmin = u.role === 'hostel_admin';
                  return (
                    <tr
                      key={u._id}
                      className={`transition-colors ${
                        isHostelAdmin
                          ? 'bg-[#fffaf7] hover:bg-[#fdece6] text-[#2a1a12]'
                          : 'hover:bg-[#f7f5f4] text-[#2a1a12]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-xs shrink-0 ${
                              isHostelAdmin
                                ? 'bg-[#e6472d] border-[#e6472d] text-white'
                                : 'bg-[#fdece6] border-[#d84e32]/20 text-[#d84e32]'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-semibold text-[#2a1a12] truncate">{u.name}</span>
                            <span className="text-[10px] text-[#6b5c54]">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'super_admin' ? (
                          <span className="text-xs text-[#6b5c54] font-bold capitalize">Super Admin</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              isHostelAdmin
                                ? 'bg-[#e6472d] text-white'
                                : 'bg-[#eef2f6] text-[#4a5568]'
                            }`}
                            title="Role is fixed at account creation and cannot be changed"
                          >
                            {isHostelAdmin && <Home size={10} />}
                            {isHostelAdmin ? 'Hostel Admin' : 'Student'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isHostelAdmin ? (
                          <button
                            onClick={() => handleOpenAssignModal(u)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#d84e32] hover:text-[#c73a22] hover:underline cursor-pointer"
                            title="Assign / Change hostel"
                          >
                            <Home size={12} />
                            {u.assignedHostel?.name || (
                              <span className="text-amber-700 flex items-center gap-1">
                                Not assigned <Edit2 size={10} />
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-[#eaddd5]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6b5c54]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : u.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {u.status === 'pending_approval' ? 'Pending Approval' : u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role === 'super_admin' ? (
                          <span className="text-xs text-[#6b5c54]">Protected</span>
                        ) : (
                          <div className="flex justify-end items-center gap-1.5">
                            {u.status === 'pending_approval' && (
                              <button
                                onClick={() => handleApprove(u._id)}
                                className="p-2 rounded-lg cursor-pointer transition-colors text-amber-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Approve Hostel Admin"
                              >
                                <UserCheck size={16} />
                              </button>
                            )}
                            {isHostelAdmin && (
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="p-2 rounded-lg cursor-pointer transition-colors text-[#9c8b83] hover:text-[#d84e32] hover:bg-[#fdece6]"
                                title="Edit Hostel Admin"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTargetUser(u)}
                              className="p-2 rounded-lg cursor-pointer transition-colors text-[#9c8b83] hover:text-red-600 hover:bg-red-50"
                              title="Delete Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
