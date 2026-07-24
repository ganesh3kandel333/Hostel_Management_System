import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Home, Bed, Info, Building, MapPin, ChevronLeft } from 'lucide-react';
import { getAllHostels } from '../../api/hostelApi.js';
import { getAvailableRoomTypes } from '../../api/roomApi.js';
import { createBooking } from '../../api/bookingApi.js';
import Loader from '../../components/Loader.jsx';

const roomTypeLabels = {
  Single: 'Single (Private room)',
  Double: 'Double (2 Share)',
  Triple: 'Triple (3 Share)',
  Dorm: 'Dormitory (Common shares)',
};

// Formats a Date object as an input[type=date] value (YYYY-MM-DD)
const toDateInputValue = (date) => date.toISOString().split('T')[0];

const todayDateValue = toDateInputValue(new Date());

// Given a check-in date string, compute the earliest allowed check-out
// (minimum 1 month stay) and the latest allowed check-out (maximum 2 years stay).
const getCheckOutBounds = (checkInValue) => {
  const base = checkInValue ? new Date(checkInValue) : new Date();

  const min = new Date(base);
  min.setMonth(min.getMonth() + 1);

  const max = new Date(base);
  max.setFullYear(max.getFullYear() + 2);

  return { min: toDateInputValue(min), max: toDateInputValue(max) };
};

const BookRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedHostelId = searchParams.get('hostelId') || '';

  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState(preselectedHostelId);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { hostelId: preselectedHostelId } });

  const watchedHostelId = watch('hostelId');
  const watchedCheckInDate = watch('checkInDate');

  useEffect(() => {
    setSelectedHostelId(watchedHostelId);
  }, [watchedHostelId]);

  // Whenever the chosen hostel changes, fetch only the room types that
  // actually have a vacant bed there right now, and clear any previously
  // selected room type since it may no longer be valid for this hostel.
  useEffect(() => {
    setValue('roomType', '');
    if (!watchedHostelId) {
      setAvailableRoomTypes([]);
      return;
    }

    let cancelled = false;
    setRoomTypesLoading(true);
    (async () => {
      try {
        const res = await getAvailableRoomTypes(watchedHostelId);
        if (!cancelled && res.success) {
          setAvailableRoomTypes(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load room availability for this hostel');
          setAvailableRoomTypes([]);
        }
      } finally {
        if (!cancelled) setRoomTypesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [watchedHostelId, setValue]);

  const checkOutBounds = getCheckOutBounds(watchedCheckInDate);

  useEffect(() => {
    const fetchHostelsData = async () => {
      try {
        const res = await getAllHostels();
        if (res.success) {
          setHostels(res.data);
          if (preselectedHostelId && res.data.some((h) => h._id === preselectedHostelId)) {
            setValue('hostelId', preselectedHostelId);
          }
        }
      } catch (err) {
        toast.error('Failed to load hostels list');
      } finally {
        setLoading(false);
      }
    };
    fetchHostelsData();
  }, [preselectedHostelId, setValue]);

  const selectedHostel = hostels.find((h) => h._id === selectedHostelId);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await createBooking(data);
      if (res.success) {
        toast.success('Booking application submitted successfully!');
        navigate('/booking-status');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-2 sm:p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/hostels" className="inline-flex items-center gap-1 text-xs font-bold text-[#e6472d] hover:underline w-fit">
          <ChevronLeft size={14} /> Back to Browse Hostels
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1a12]">Apply for a Room</h1>
        <p className="text-[#6b5c54] text-sm">Choose your hostel, room type and stay dates below.</p>
      </div>

      {/* Selected hostel context card */}
      {selectedHostel && (
        <div className="bg-white border border-[#eaddd5]/70 rounded-2xl overflow-hidden shadow-sm flex items-center gap-4 p-4">
          <div className="w-20 h-20 rounded-xl bg-[#fdece6] overflow-hidden shrink-0">
            {selectedHostel.images?.length > 0 ? (
              <img src={selectedHostel.images[0]} alt={selectedHostel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building size={26} className="text-[#eaddd5]" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[#2a1a12] text-base">{selectedHostel.name}</span>
            {selectedHostel.address && (
              <span className="text-xs text-[#9c8b83] flex items-center gap-1">
                <MapPin size={12} className="text-[#e6472d]" /> {selectedHostel.address}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#eaddd5]/40 shadow-sm">
        {hostels.length === 0 ? (
          <div className="text-center py-6 text-[#9c8b83] text-sm flex flex-col items-center gap-3">
            <Info size={36} />
            <p>No active hostels available for booking at the moment. Please contact system admin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Hostel Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">Select Hostel Campus</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9c8b83]">
                  <Home size={18} />
                </span>
                <select
                  {...register('hostelId', { required: 'Please select a hostel' })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all cursor-pointer"
                >
                  <option value="">Choose a campus...</option>
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} - {h.city}
                    </option>
                  ))}
                </select>
              </div>
              {errors.hostelId && (
                <span className="text-xs text-[#ba1a1a] font-semibold">{errors.hostelId.message}</span>
              )}
            </div>

            {/* Room Type — only shows types that are actually vacant right now,
                so a student never picks something that's already full */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b5c54]">Desired Room Type</label>

              {!watchedHostelId ? (
                <p className="text-xs text-[#9c8b83] italic py-2">Select a hostel above to see available room types.</p>
              ) : roomTypesLoading ? (
                <div className="py-3"><Loader size="sm" /></div>
              ) : availableRoomTypes.length === 0 ? (
                <div className="flex items-center gap-2 py-3 px-3 bg-[#fdece6] rounded-xl text-xs text-[#9c4a2f] font-semibold">
                  <Info size={14} className="shrink-0" />
                  No rooms are available at this hostel right now. Please try another hostel or check back later.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableRoomTypes.map((rt) => (
                    <label
                      key={rt.type}
                      className="relative flex flex-col items-center justify-center gap-1 py-3 px-2 border border-[#eaddd5] rounded-xl text-center cursor-pointer transition-all hover:border-[#e6472d] has-[:checked]:border-[#e6472d] has-[:checked]:bg-[#fdece6]"
                    >
                      <input
                        type="radio"
                        value={rt.type}
                        {...register('roomType', { required: 'Please select room tier' })}
                        className="sr-only"
                      />
                      <Bed size={16} className="text-[#e6472d]" />
                      <span className="text-[10px] font-bold text-[#2a1a12]">{roomTypeLabels[rt.type] || rt.type}</span>
                      <span className="text-[9px] text-[#9c8b83]">{rt.availableBeds} bed{rt.availableBeds === 1 ? '' : 's'} left</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.roomType && (
                <span className="text-xs text-[#ba1a1a] font-semibold">{errors.roomType.message}</span>
              )}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-In Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Planned Check-in Date</label>
                <input
                  type="date"
                  min={todayDateValue}
                  {...register('checkInDate', {
                    required: 'Check-in date is required',
                    validate: (value) =>
                      value >= todayDateValue || 'Check-in date cannot be before today',
                  })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
                {errors.checkInDate && (
                  <span className="text-xs text-[#ba1a1a] font-semibold">{errors.checkInDate.message}</span>
                )}
              </div>

              {/* Check-Out Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Planned Check-out Date</label>
                <input
                  type="date"
                  min={checkOutBounds.min}
                  max={checkOutBounds.max}
                  {...register('checkOutDate', {
                    required: 'Check-out date is required',
                    validate: (value) => {
                      const { min, max } = getCheckOutBounds(watch('checkInDate'));
                      if (value < min) return 'Minimum living period is 1 month from check-in';
                      if (value > max) return 'Maximum stay allowed is 2 years from check-in';
                      return true;
                    },
                  })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
                />
                {errors.checkOutDate && (
                  <span className="text-xs text-[#ba1a1a] font-semibold">{errors.checkOutDate.message}</span>
                )}
                <span className="text-[10px] text-[#9c8b83]">Minimum stay: 1 month · Maximum stay: 2 years</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !watchedHostelId || roomTypesLoading || availableRoomTypes.length === 0}
              className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] disabled:bg-[#e6472d]/50 disabled:cursor-not-allowed active:scale-98 text-white font-bold rounded-xl shadow-md shadow-[#e6472d]/10 transition-all flex items-center justify-center cursor-pointer mt-2"
            >
              {submitting ? <Loader size="sm" /> : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookRoom;
