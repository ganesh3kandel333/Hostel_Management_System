import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, MapPin, Search } from 'lucide-react';
import { getAllHostels } from '../../api/hostelApi.js';
import Loader from '../../components/Loader.jsx';

const BrowseHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const res = await getAllHostels();
        if (res.success) setHostels(res.data || []);
      } catch (err) {
        console.error('Failed to load hostels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHostels();
  }, []);

  const filtered = hostels.filter((h) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (h.name || '').toLowerCase().includes(q) || (h.city || '').toLowerCase().includes(q);
  });

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[#2a1a12]">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-2xl font-extrabold text-[#2a1a12]">Browse Hostels</h1>
        <p className="text-xs text-[#9c8b83]">Pick a hostel and apply for a room in a few clicks.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9c8b83]">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by hostel name or city"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#fdece6]/60 border border-[#eaddd5]/40 rounded-2xl p-10 text-center text-sm text-[#9c8b83]">
          {hostels.length === 0 ? 'No hostels are available yet. Check back soon!' : `No hostels match "${query}".`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((hostel) => (
            <div
              key={hostel._id}
              className="bg-white border border-[#eaddd5]/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-[#fdece6] overflow-hidden">
                {hostel.images?.length > 0 ? (
                  <img src={hostel.images[0]} alt={hostel.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building size={36} className="text-[#eaddd5]" />
                  </div>
                )}
                {hostel.city && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 text-[#e6472d] text-[10px] font-bold rounded-lg shadow-sm">
                    {hostel.city}
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                <h3 className="font-bold text-[#2a1a12] text-base truncate">{hostel.name}</h3>

                {hostel.address && (
                  <p className="text-xs text-[#9c8b83] flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 text-[#e6472d] shrink-0" />
                    {hostel.address}
                  </p>
                )}

                {hostel.description && (
                  <p className="text-xs text-[#6b5c54] line-clamp-2 leading-relaxed">{hostel.description}</p>
                )}

                {hostel.facilities?.length > 0 && (
                  <p className="text-[11px] text-[#9c8b83] font-medium">
                    {hostel.facilities.slice(0, 3).join(' · ')}
                  </p>
                )}

                <Link
                  to={`/book-room?hostelId=${hostel._id}`}
                  className="mt-auto w-full text-center py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                >
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseHostels;
