import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DollarSign, Check, X, FileText, Image, User, Calendar, ExternalLink } from 'lucide-react';
import { getAllPayments, verifyPayment } from '../../api/paymentApi.js';
import Loader from '../../components/Loader.jsx';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification Modal States
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getAllPayments();
      if (res.success) {
        setPayments(res.data);
      }
    } catch (err) {
      toast.error('Failed to load transaction registers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenVerifyModal = (payment) => {
    setSelectedPayment(payment);
    setShowVerifyModal(true);
  };

  const handleConfirmVerification = async (status) => {
    try {
      const res = await verifyPayment(selectedPayment._id, status);
      if (res.success) {
        toast.success(`Payment successfully marked as ${status.toUpperCase()}!`);
        setShowVerifyModal(false);
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update transaction status');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'failed') return 'text-red-700 bg-red-50 border-red-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#2a1a12]">Payment Audit</h1>
        <p className="text-[#6b5c54] text-sm">Monitor student fees payments, wire receipts, and verify deposits.</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#eaddd5]/40 shadow-sm text-[#6b5c54] text-sm">
          No payment transaction records found in logs.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eaddd5]/45 shadow-sm overflow-hidden text-[#2a1a12]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fdece6] text-[#2a1a12] text-xs font-bold uppercase tracking-wider border-b border-[#eaddd5]/40">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd5]/30 text-sm">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-[#fdece6]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-[#fdece6] text-[#d84e32] rounded-lg">
                          <User size={16} />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#2a1a12]">{p.userId?.name}</span>
                          <span className="text-[10px] text-[#6b5c54]">{p.userId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {p.bookingId?.hostelId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 capitalize">{p.paymentMethod}</td>
                    <td className="px-6 py-4 font-mono text-xs">{p.transactionId}</td>
                    <td className="px-6 py-4 font-bold text-[#2a1a12]">Rs. {p.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'pending' ? (
                        <button
                          onClick={() => handleOpenVerifyModal(p)}
                          className="px-3 py-1.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md transition-colors"
                        >
                          Verify Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-[#9c8b83]">Audited</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowVerifyModal(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          
          <div className="bg-white border border-[#eaddd5]/50 max-w-lg w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in text-[#2a1a12]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2a1a12]">Verify Payment Receipt</h3>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 text-[#9c8b83] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs text-[#9c8b83]">Student Name</span>
                <p className="text-sm font-semibold text-[#2a1a12]">{selectedPayment.userId?.name}</p>
              </div>
              <div>
                <span className="text-xs text-[#9c8b83]">Amount Paid</span>
                <p className="text-sm font-bold text-[#d84e32]">Rs. {selectedPayment.amount}</p>
              </div>
              <div>
                <span className="text-xs text-[#9c8b83]">Payment Channel</span>
                <p className="text-sm font-semibold text-[#2a1a12] capitalize">{selectedPayment.paymentMethod}</p>
              </div>
              <div>
                <span className="text-xs text-[#9c8b83]">Transaction Ref</span>
                <p className="text-sm font-semibold text-[#2a1a12] font-mono text-xs">{selectedPayment.transactionId}</p>
              </div>
            </div>

            {/* Receipt Image Preview */}
            {selectedPayment.receiptImage ? (
              <div className="mb-6 flex flex-col gap-2">
                <span className="text-xs text-[#9c8b83]">Receipt Snapshot</span>
                <div className="relative group border border-[#eaddd5]/40 rounded-xl overflow-hidden bg-[#fdf8f5] flex justify-center max-h-56 p-2">
                  <img
                    src={selectedPayment.receiptImage}
                    alt="Receipt wire slip"
                    className="max-h-52 object-contain rounded-lg"
                  />
                  <a
                    href={selectedPayment.receiptImage}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-2 bg-[#e6472d]/95 text-white hover:bg-[#c73a22] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold"
                  >
                    View Full <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-[#fdece6]/40 text-center rounded-xl border border-[#eaddd5]/40 text-xs text-[#9c8b83] flex items-center justify-center gap-1.5">
                <FileText size={16} /> No physical receipt snapshot uploaded.
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => handleConfirmVerification('failed')}
                className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1"
              >
                <X size={14} /> Reject Deposit
              </button>
              <button
                onClick={() => handleConfirmVerification('completed')}
                className="px-4 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-lg shadow-[#e6472d]/20"
              >
                <Check size={14} /> Approve Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
