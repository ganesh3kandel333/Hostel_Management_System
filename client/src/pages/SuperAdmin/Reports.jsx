import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { getAllHostels } from '../../api/hostelApi.js';
import { getAllBookings } from '../../api/bookingApi.js';
import Loader from '../../components/Loader.jsx';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

const PIE_COLORS = ['#e6472d', '#d84e32', '#ff9d7d', '#f3b8a3', '#f6d9cd'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState(null);
  const [hostelStats, setHostelStats] = useState({
    totalHostels: 0,
    totalActiveBookings: 0,
  });

  const fetchReportStats = async () => {
    setLoading(true);
    try {
      const hostelsRes = await getAllHostels();
      const bookingsRes = await getAllBookings({ status: 'approved' });

      if (hostelsRes.success && bookingsRes.success) {
        const hostelsList = hostelsRes.data;
        const activeBookings = bookingsRes.data;

        setHostelStats({
          totalHostels: hostelsList.length,
          totalActiveBookings: activeBookings.length,
        });

        // Occupancy by hostel
        const occupancyByHostel = {};
        hostelsList.forEach((h) => {
          occupancyByHostel[h.name] = 0;
        });
        activeBookings.forEach((b) => {
          const hName = b.hostelId?.name;
          if (hName && occupancyByHostel[hName] !== undefined) {
            occupancyByHostel[hName] += 1;
          }
        });

        setOccupancyData({
          labels: Object.keys(occupancyByHostel),
          datasets: [
            {
              label: 'Occupants',
              data: Object.values(occupancyByHostel),
              backgroundColor: Object.keys(occupancyByHostel).map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        });
      }
    } catch (err) {
      toast.error('Failed to load report statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportStats();
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
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">Reports</h1>
          <p className="text-[#6b5c54] text-sm">Occupancy distribution across registered hostels.</p>
        </div>
        <button
          onClick={fetchReportStats}
          className="p-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#eaddd5]/40 p-5 rounded-xl shadow-sm flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Total Hostels</span>
          <span className="text-2xl font-extrabold text-[#2a1a12]">{hostelStats.totalHostels}</span>
        </div>
        <div className="bg-white border border-[#eaddd5]/40 p-5 rounded-xl shadow-sm flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Active Residents</span>
          <span className="text-2xl font-extrabold text-[#2a1a12]">{hostelStats.totalActiveBookings}</span>
        </div>
      </div>

      {/* Occupancy Chart */}
      <div className="bg-white border border-[#eaddd5]/40 p-6 rounded-xl shadow-sm flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#2a1a12]">Active Occupants by Hostel</h3>
        <div className="h-80 relative flex justify-center">
          {occupancyData && occupancyData.labels.length > 0 ? (
            <Pie data={occupancyData} options={pieChartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#9c8b83]">No occupancy data yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
