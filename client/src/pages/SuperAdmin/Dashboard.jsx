import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
} from 'chart.js';
import {
  Home,
  Users,
  Plus,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { getAllHostels } from '../../api/hostelApi.js';
import { getHostelRooms } from '../../api/roomApi.js';
import { getAllBookings } from '../../api/bookingApi.js';
import { getAllUsers } from '../../api/userApi.js';
import Loader from '../../components/Loader.jsx';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, ArcElement, Tooltip);

const PIE_COLORS = ['#e6472d', '#d84e32', '#ff9d7d', '#f3b8a3', '#f6d9cd'];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({
    hostels: 0,
    students: 0,
    occupancyRate: 0,
    pendingBookings: 0,
  });

  // Occupancy chart data
  const [occupancyData, setOccupancyData] = useState({
    labels: [],
    datasets: []
  });

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all hostels
      const hostelsRes = await getAllHostels();
      const hostelsList = hostelsRes.success ? hostelsRes.data : [];

      // 2. Fetch all bookings to calculate students
      const bookingsRes = await getAllBookings();
      const allBookings = bookingsRes.success ? bookingsRes.data : [];
      const activeStudentsCount = allBookings.filter(b => b.status === 'approved').length;
      const pendingBookingsCount = allBookings.filter(b => b.status === 'pending').length;

      // 3. Fetch all hostel admins
      const usersRes = await getAllUsers({ role: 'hostel_admin' });
      const adminUsers = usersRes.success ? usersRes.data : [];

      // 4. Fetch rooms occupancy stats for hostels
      let totalBedsAll = 0;
      let occupiedBedsAll = 0;
      const occupancyByHostel = {};

      const hostelsWithStats = await Promise.all(
        hostelsList.map(async (h) => {
          const roomsRes = await getHostelRooms(h._id);
          let totalBeds = 0;
          let occupiedBeds = 0;
          if (roomsRes.success) {
            totalBeds = roomsRes.data.reduce((sum, r) => sum + r.capacity, 0);
            occupiedBeds = roomsRes.data.reduce((sum, r) => sum + (r.currentOccupants?.length || 0), 0);
          }

          totalBedsAll += totalBeds;
          occupiedBedsAll += occupiedBeds;
          occupancyByHostel[h.name] = occupiedBeds;

          return {
            ...h,
            totalBeds,
            occupiedBeds,
          };
        })
      );

      setHostels(hostelsWithStats);
      setStats({
        hostels: hostelsList.length,
        students: activeStudentsCount,
        occupancyRate: totalBedsAll > 0 ? Math.round((occupiedBedsAll / totalBedsAll) * 100) : 0,
        pendingBookings: pendingBookingsCount,
      });

      setAdmins(adminUsers.slice(0, 5));

      // Build occupancy-by-hostel pie chart
      setOccupancyData({
        labels: Object.keys(occupancyByHostel),
        datasets: [
          {
            label: 'Occupants',
            data: Object.values(occupancyByHostel),
            backgroundColor: Object.keys(occupancyByHostel).map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
            borderColor: '#ffffff',
            borderWidth: 2,
          }
        ]
      });

    } catch (err) {
      console.error('Failed to load super admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#6b5c54', font: { family: 'Outfit', size: 11 }, boxWidth: 10 },
      },
    },
  };

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[#2a1a12]">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2a1a12]">Control Center</h1>
          <p className="text-xs text-[#9c8b83]">Everything happening across your hostels, at a glance.</p>
        </div>
        <button
          onClick={fetchSuperAdminData}
          className="p-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-white rounded-lg transition-all cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Unified stats strip — one card, no repeated boxes */}
      <div className="bg-white border border-[#eaddd5]/40 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#eaddd5]/40">
        {[
          { label: 'Total Hostels', value: stats.hostels, hint: 'System wide campuses', icon: Home },
          { label: 'Active Residents', value: stats.students.toLocaleString(), hint: 'Currently checked in', icon: Users },
          { label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, hint: 'System wide beds filled', icon: null },
          { label: 'Pending Bookings', value: stats.pendingBookings, hint: 'Awaiting admin review', icon: Clock },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-5">
              <div className="w-9 h-9 rounded-lg bg-[#fdece6] text-[#e6472d] flex items-center justify-center shrink-0 font-bold text-sm">
                {Icon ? <Icon size={18} /> : '%'}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider truncate">{item.label}</span>
                <span className="text-xl font-extrabold text-[#2a1a12]">{item.value}</span>
                <span className="text-[10px] text-gray-500 truncate">{item.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Central charts / lists row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Occupancy pie chart */}
        <div className="lg:col-span-8 bg-white border border-[#eaddd5]/40 p-6 rounded-xl flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-[#2a1a12]">Occupancy by Hostel</h3>
            <p className="text-[10px] text-[#9c8b83]">Distribution of active residents across hostels</p>
          </div>
          <div className="h-64 relative flex justify-center">
            {occupancyData.labels.length > 0 ? (
              <Pie data={occupancyData} options={pieChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#9c8b83]">No occupancy data yet</div>
            )}
          </div>
        </div>

        {/* Recent Admins */}
        <div className="lg:col-span-4 bg-white border border-[#eaddd5]/40 p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#2a1a12]">Recent Hostel Admins</h3>
              <button onClick={() => navigate('/manage-users')} className="text-xs font-semibold text-[#e6472d] hover:underline cursor-pointer">View All</button>
            </div>

            <div className="flex flex-col gap-3.5">
              {admins.length === 0 ? (
                <div className="text-xs text-center text-[#9c8b83] py-8">
                  No hostel admins created yet.
                </div>
              ) : (
                admins.map((adm, i) => (
                  <div key={i} className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#f6d9cd] text-[#e6472d] flex items-center justify-center font-bold text-xs">
                        {adm.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate max-w-[120px]">
                        <span className="text-xs font-bold text-[#2a1a12] truncate">{adm.name}</span>
                        <span className="text-[9px] text-[#9c8b83] truncate">{adm.email}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[8px] text-[#9c8b83]">{new Date(adm.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        adm.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {adm.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/manage-users')}
            className="w-full py-2 border border-[#e6472d] hover:bg-[#fdece6] text-[#e6472d] font-bold text-xs rounded-lg transition-all mt-4 cursor-pointer"
          >
            <UserCheck size={14} className="inline mr-1.5 -mt-0.5" /> Create Hostel Admin
          </button>
        </div>
      </div>

      {/* Hostel Performance Table Section */}
      <div className="bg-white border border-[#eaddd5]/40 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#eaddd5]/20 flex flex-wrap justify-between items-center gap-4">
          <h3 className="text-sm font-bold text-[#2a1a12]">Hostel Performance Index</h3>
          <button
            onClick={() => navigate('/manage-hostels')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#e6472d] hover:bg-[#c73a22] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} /> Register New Hostel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fdece6] text-[#6b5c54] text-[10px] font-bold uppercase tracking-wider border-b border-[#eaddd5]/40">
                <th className="px-6 py-3">Hostel Name</th>
                <th className="px-6 py-3">Region</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Hostel Admin</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaddd5]/20 text-xs text-[#6b5c54]">
              {hostels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hostels currently registered. Click Register New Hostel.
                  </td>
                </tr>
              ) : (
                hostels.map((h) => {
                  const occupancyRate = h.totalBeds > 0 ? Math.round((h.occupiedBeds / h.totalBeds) * 100) : 0;
                  return (
                    <tr key={h._id} className="hover:bg-[#fdf8f5] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#e6472d]">{h.name}</td>
                      <td className="px-6 py-4">{h.city}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-28">
                          <span className="text-[10px] font-medium text-gray-600">
                            {h.occupiedBeds} / {h.totalBeds} Beds
                          </span>
                          <div className="w-full bg-[#fdece6] h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[#e6472d] h-full"
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          occupancyRate >= 100
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : h.totalBeds === 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {occupancyRate >= 100 ? 'Full' : h.totalBeds === 0 ? 'No Inventory' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#2a1a12]">
                        {h.admin?.name || <span className="text-[#9c8b83] font-normal italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate('/manage-hostels')} className="text-[#9c8b83] hover:text-[#e6472d] p-1 rounded hover:bg-[#fdece6] cursor-pointer">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Paging */}
        <div className="px-6 py-3 border-t border-[#eaddd5]/20 flex justify-between items-center text-[10px] text-[#9c8b83]">
          <span>Showing 1-{hostels.length} of {hostels.length} hostels</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded border border-[#eaddd5] hover:bg-gray-50 text-gray-400">
              <ChevronLeft size={14} />
            </button>
            <button className="p-1 rounded border border-[#eaddd5] hover:bg-gray-50 text-gray-400">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => navigate('/manage-hostels')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#e6472d] hover:bg-[#c73a22] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default SuperAdminDashboard;
