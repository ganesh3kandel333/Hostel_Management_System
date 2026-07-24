import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Images, Plus, Trash2, Edit2, X, Check, Upload, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
} from '../../api/heroSlideApi.js';
import Loader from '../../components/Loader.jsx';

const ManageHeroSlides = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await getHeroSlides();
      if (res.success) setSlides(res.data);
    } catch (err) {
      toast.error('Failed to load landing page slider');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleOpenAddModal = () => {
    setNewLabel('');
    setNewImageFile(null);
    setNewImagePreview(null);
    setShowAddModal(true);
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = async (e) => {
    e.preventDefault();
    if (!newImageFile) {
      toast.error('Please choose an image for the slide');
      return;
    }

    const formData = new FormData();
    formData.append('image', newImageFile);
    formData.append('label', newLabel);

    setSaving(true);
    try {
      const res = await createHeroSlide(formData);
      if (res.success) {
        toast.success('Slide added to landing page');
        setShowAddModal(false);
        fetchSlides();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add slide');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (slideItem) => {
    setEditingSlide(slideItem);
    setEditLabel(slideItem.label || '');
    setEditImageFile(null);
    setEditImagePreview(slideItem.image);
    setShowEditModal(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('label', editLabel);
    if (editImageFile) formData.append('image', editImageFile);

    setSaving(true);
    try {
      const res = await updateHeroSlide(editingSlide._id, formData);
      if (res.success) {
        toast.success('Slide updated');
        setShowEditModal(false);
        fetchSlides();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (window.confirm('Remove this slide from the landing page?')) {
      try {
        const res = await deleteHeroSlide(id);
        if (res.success) {
          toast.success('Slide removed');
          fetchSlides();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to remove slide');
      }
    }
  };

  const moveSlide = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const reordered = [...slides];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setSlides(reordered);
    setReordering(true);
    try {
      await reorderHeroSlides(reordered.map((s) => s._id));
    } catch (err) {
      toast.error('Failed to save new slide order');
      fetchSlides();
    } finally {
      setReordering(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">Landing Page Slider</h1>
          <p className="text-[#6b5c54] text-sm">
            Manage the images that rotate on the homepage hero banner. Reorder, replace, or remove them any time.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} /> Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="bg-white border border-[#eaddd5]/40 p-12 text-center rounded-2xl shadow-sm text-[#9c8b83] text-sm flex flex-col items-center gap-3">
          <Images size={32} className="text-[#d84e32]" />
          <p>No slides configured yet. The homepage is showing its default fallback images.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 px-5 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-semibold text-sm rounded-xl cursor-pointer"
          >
            Add Your First Slide
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((s, i) => (
            <div
              key={s._id}
              className="bg-white border border-[#eaddd5]/40 rounded-2xl shadow-sm p-4 flex items-center gap-4"
            >
              <div className="flex flex-col items-center gap-1 text-[#9c8b83] shrink-0">
                <GripVertical size={16} />
                <span className="text-[10px] font-bold">#{i + 1}</span>
              </div>

              <img
                src={s.image}
                alt={s.label || `Slide ${i + 1}`}
                className="w-32 h-20 object-cover rounded-xl border border-[#eaddd5] shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2a1a12] truncate">
                  {s.label || <span className="text-[#9c8b83] italic font-normal">No label</span>}
                </p>
                <p className="text-[11px] text-[#9c8b83] mt-0.5">Displayed on the homepage hero banner</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => moveSlide(i, -1)}
                  disabled={i === 0 || reordering}
                  title="Move earlier"
                  className="p-2 bg-[#f1eeec] hover:bg-[#eaddd5] disabled:opacity-40 disabled:cursor-not-allowed text-[#6b5c54] rounded-lg cursor-pointer transition-colors"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveSlide(i, 1)}
                  disabled={i === slides.length - 1 || reordering}
                  title="Move later"
                  className="p-2 bg-[#f1eeec] hover:bg-[#eaddd5] disabled:opacity-40 disabled:cursor-not-allowed text-[#6b5c54] rounded-lg cursor-pointer transition-colors"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => handleOpenEditModal(s)}
                  title="Edit slide"
                  className="p-2 bg-[#fdece6] hover:bg-[#f3d3c6] text-[#d84e32] rounded-lg cursor-pointer transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSlide(s._id)}
                  title="Remove slide"
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Slide Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white border border-[#eaddd5]/40 max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2a1a12]">Add Slide</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#9c8b83] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSlide} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 items-center">
                <div className="w-full h-40 rounded-xl border border-dashed border-[#eaddd5] hover:border-[#e6472d]/50 bg-[#fdf8f5] flex items-center justify-center relative overflow-hidden cursor-pointer">
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Slide preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#9c8b83]">
                      <Upload size={20} />
                      <span className="text-[11px]">Upload slide image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleNewImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Caption (optional)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Comfortable Dorms"
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 active:scale-98 text-white font-semibold rounded-xl transition-all cursor-pointer mt-2 flex items-center justify-center gap-1.5"
              >
                <Check size={18} /> {saving ? 'Uploading...' : 'Add Slide'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Slide Modal */}
      {showEditModal && editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowEditModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white border border-[#eaddd5]/40 max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2a1a12]">Edit Slide</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-[#9c8b83] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 items-center">
                <div className="w-full h-40 rounded-xl border border-dashed border-[#eaddd5] hover:border-[#e6472d]/50 bg-[#fdf8f5] flex items-center justify-center relative overflow-hidden cursor-pointer">
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Slide preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#9c8b83]">
                      <Upload size={20} />
                      <span className="text-[11px]">Replace slide image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleEditImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Caption (optional)</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. Comfortable Dorms"
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:opacity-60 active:scale-98 text-white font-semibold rounded-xl transition-all cursor-pointer mt-2 flex items-center justify-center gap-1.5"
              >
                <Check size={18} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHeroSlides;
