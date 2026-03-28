import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Filter, 
  X,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LeaveFormData {
  reason: string;
  startDate: string;
  endDate: string;
}

export default function Leave() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState<LeaveFormData>({
    reason: '',
    startDate: '',
    endDate: '',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let q;
      if (userData?.role === 'student') {
        q = query(
          collection(db, 'leaveRequests'), 
          where('studentId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'leaveRequests'), 
          orderBy('createdAt', 'desc')
        );
      }
      const querySnapshot = await getDocs(q);
      setRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userData]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await addDoc(collection(db, 'leaveRequests'), {
        studentId: userData.uid,
        studentName: userData.name,
        class: userData.class,
        reason: formData.reason,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });

      toast.success('Leave request submitted successfully');
      setIsAddModalOpen(false);
      setFormData({ reason: '', startDate: '', endDate: '' });
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit request');
    }
  };

  const handleReviewRequest = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, 'leaveRequests', id), {
        status,
        reviewedBy: userData.name,
        reviewedAt: new Date().toISOString(),
      });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error('Review failed');
    }
  };

  const filteredRequests = requests.filter(req => 
    statusFilter === 'All' || req.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      case 'Pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave System</h1>
          <p className="text-gray-500 text-sm">Apply for leave and track your requests.</p>
        </div>
        {userData?.role === 'student' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
          >
            <Plus size={20} />
            Apply for Leave
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
              statusFilter === status 
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => (
            <motion.div
              layout
              key={req.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#FF2D55] font-bold text-lg border border-gray-100">
                    {req.studentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{req.studentName}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{req.class}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <CalendarDays size={16} className="text-gray-400" />
                  {format(new Date(req.startDate), 'MMM d')} - {format(new Date(req.endDate), 'MMM d, yyyy')}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <MessageSquare size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="italic">"{req.reason}"</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <Clock size={12} />
                  Applied {format(new Date(req.createdAt), 'MMM d')}
                </div>
                
                {(userData?.role === 'teacher' || userData?.role === 'admin') && req.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReviewRequest(req.id, 'Approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                    >
                      <CheckCircle2 size={24} />
                    </button>
                    <button 
                      onClick={() => handleReviewRequest(req.id, 'Rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>
                )}
                
                {req.status !== 'Pending' && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Reviewed by: {req.reviewedBy}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CalendarDays size={40} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No leave requests</h3>
              <p className="text-gray-500 text-sm">Everything looks good!</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-[#FF2D55] text-white flex items-center justify-between">
                <h2 className="text-xl font-bold">Apply for Leave</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddRequest} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">End Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Reason for Leave</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Explain why you need leave..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#FF2D55] text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
