import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Home, Upload, X, Check, MapPin, Mail, Phone, UserCog } from 'lucide-react';
import { getAllHostels, createHostel, updateHostel, deleteHostel } from '../../api/hostelApi.js';
import { getProfile } from '../../api/userApi.js';
import { updateProfileSuccess } from '../../redux/authSlice.js';
import Loader from '../../components/Loader.jsx';

const ManageHostels = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const isHostelAdmin = user?.role === 'hostel_admin';

  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedHostelId, setSelectedHostelId] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [facilities, setFacilities] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const res = await getAllHostels();
      if (res.success) {
        setHostels(res.data);
      }
    } catch (err) {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setName('');
    setDescription('');
    setAddress('');
    setCity('');
    setContactEmail('');
    setContactPhone('');
    setFacilities('');
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (hostel) => {
    setModalMode('edit');
    setSelectedHostelId(hostel._id);
    setName(hostel.name);
    setDescription(hostel.description || '');
    setAddress(hostel.address);
    setCity(hostel.city);
    setContactEmail(hostel.contactEmail || '');
    setContactPhone(hostel.contactPhone || '');
    setFacilities(hostel.facilities.join(', '));
    setImageFile(null);
    setImagePreview(hostel.images?.[0] || null);
    setShowModal(true);
  };

  const handleSaveHostel = async (e) => {
    e.preventDefault();
    if (!name || !address || !city) {
      toast.error('Name, address, and city are required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('contactEmail', contactEmail);
    formData.append('contactPhone', contactPhone);
    formData.append('facilities', facilities);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setSaving(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await createHostel(formData);
        if (res.success) toast.success('Hostel registered successfully!');

        // If a hostel_admin just created their own hostel, refresh their profile
        // so `user.assignedHostel` is populated everywhere (dashboard, sidebar, etc).
        if (isHostelAdmin && res.success) {
          try {
            const profileRes = await getProfile();
            if (profileRes.success) dispatch(updateProfileSuccess(profileRes.data));
          } catch {
            // Non-fatal — the next page load will pick up the assignment anyway.
          }
        }
      } else {
        res = await updateHostel(selectedHostelId, formData);
        if (res.success) toast.success('Hostel updated successfully!');
      }
      setShowModal(false);
      fetchHostels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hostel');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHostel = async (hostelId) => {
    if (
      window.confirm(
        'Delete this hostel? This removes all its room logs. Any students currently booked here will have that booking cancelled (their accounts are kept, and they remain free to apply to another hostel).'
      )
    ) {
      try {
        const res = await deleteHostel(hostelId);
        if (res.success) {
          toast.success('Hostel deleted successfully');
          fetchHostels();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete hostel');
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">
            {isHostelAdmin ? 'My Hostel' : 'Hostel Properties'}
          </h1>
          <p className="text-[#6b5c54] text-sm">
            {isHostelAdmin
              ? 'Register your hostel once, then manage its details here.'
              : 'Register new hostels or update existing property details.'}
          </p>
        </div>
        {(!isHostelAdmin || hostels.length === 0) && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={18} /> Register Hostel
          </button>
        )}
      </div>

      {hostels.length === 0 ? (
        <div className="bg-white border border-[#eaddd5]/40 p-12 text-center rounded-2xl shadow-sm text-[#9c8b83] text-sm">
          {isHostelAdmin
            ? 'You haven\'t registered a hostel yet. Click "Register Hostel" to create the one you\'ll manage — you can then add rooms to it.'
            : 'No hostels registered yet. Click "Register Hostel" to add one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hostels.map((h) => (
            <div key={h._id} className="bg-white border border-[#eaddd5]/40 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              {/* Image Banner */}
              <div className="h-48 w-full bg-[#fdece6] overflow-hidden relative">
                {h.images?.[0] ? (
                  <img src={h.images[0]} alt={h.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#f3b8a3]">
                    <Home size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(h)}
                    className="p-2 bg-[#e6472d]/90 hover:bg-[#c73a22] text-white rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    <Edit size={14} />
                  </button>
                  {!isHostelAdmin && (
                    <button
                      onClick={() => handleDeleteHostel(h._id)}
                      className="p-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Info panel */}
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-[#2a1a12]">{h.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#9c8b83] mt-1">
                    <MapPin size={12} className="text-[#e6472d]" />
                    <span>{h.city}, {h.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mt-1.5">
                    <UserCog size={12} className={h.admin ? 'text-emerald-600' : 'text-amber-600'} />
                    {h.admin ? (
                      <span className="text-[#6b5c54]">
                        Managed by <span className="font-semibold text-[#2a1a12]">{h.admin.name}</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">No hostel admin assigned yet</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#6b5c54] leading-relaxed truncate-3-lines">
                  {h.description || 'No description provided.'}
                </p>

                <hr className="border-[#eaddd5]/40" />

                <div className="flex flex-wrap gap-3 text-xs text-[#9c8b83]">
                  {h.contactEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-[#9c8b83]" />
                      <span>{h.contactEmail}</span>
                    </div>
                  )}
                  {h.contactPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-[#9c8b83]" />
                      <span>{h.contactPhone}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#6b5c54] mt-2">{h.facilities.join(' · ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Layout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="bg-white border border-[#eaddd5]/40 max-w-lg w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2a1a12] capitalize">
                {modalMode === 'add' ? 'Register Hostel' : 'Edit Hostel Setup'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#9c8b83] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHostel} className="flex flex-col gap-4">
              {/* Image banner upload */}
              <div className="flex flex-col gap-1.5 items-center">
                <div className="w-full h-32 rounded-xl border border-dashed border-[#eaddd5] hover:border-[#e6472d]/50 bg-[#fdf8f5] flex items-center justify-center relative overflow-hidden cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#9c8b83]">
                      <Upload size={20} />
                      <span className="text-[11px]">Upload hostel marketing image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Hostel Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Address Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none"
                  />
                </div>
                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none"
                  />
                </div>
                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none"
                  />
                </div>
              </div>

              {/* Facilities */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Facilities (comma separated)</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 active:scale-98 text-white font-semibold rounded-xl transition-all cursor-pointer mt-4 flex items-center justify-center gap-1.5"
              >
                <Check size={18} /> {saving ? 'Saving...' : 'Save Hostel Setup'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHostels;
