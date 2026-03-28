import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeeFormData {
  studentId: string;
  studentName: string;
  class: string;
  amount: number;
  dueDate: string;
}

export default function Fees() {
  const { userData } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  const [formData, setFormData] = useState<FeeFormData>({
    studentId: '',
    studentName: '',
    class: 'Class 6',
    amount: 0,
    dueDate: '',
  });

  const classes = ['All', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 PCM', 'Class 12 PCM'];

  const fetchFees = async () => {
    setLoading(true);
    try {
      let q;
      if (userData?.role === 'student') {
        q = query(
          collection(db, 'fees'), 
          where('studentId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'fees'), 
          orderBy('createdAt', 'desc')
        );
      }
      const querySnapshot = await getDocs(q);
      setFees(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [userData]);

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      // In a real app, you'd fetch the student's name from their ID
      await addDoc(collection(db, 'fees'), {
        ...(formData as any),
        paidAmount: 0,
        status: 'Due',
        createdAt: new Date().toISOString(),
      });

      toast.success('Fee record added successfully');
      setIsAddModalOpen(false);
      setFormData({ studentId: '', studentName: '', class: 'Class 6', amount: 0, dueDate: '' });
      fetchFees();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add fee record');
    }
  };

  const handleUpdatePayment = async (id: string, currentPaid: number, total: number) => {
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(Number(amount))) return;

    const newPaid = currentPaid + Number(amount);
    const status = newPaid >= total ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Due');

    try {
      await updateDoc(doc(db, 'fees', id), {
        paidAmount: newPaid,
        status,
        lastPaymentDate: new Date().toISOString(),
      });
      toast.success('Payment updated');
      fetchFees();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         fee.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || fee.class === classFilter;
    return matchesSearch && matchesClass;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Partial': return 'text-orange-600 bg-orange-50';
      case 'Due': return 'text-red-600 bg-red-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Module</h1>
          <p className="text-gray-500 text-sm">Track payments and manage student fees.</p>
        </div>
        {userData?.role === 'admin' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
          >
            <Plus size={20} />
            Add Fee Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={`px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                classFilter === cls 
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Fees List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{fee.studentName}</p>
                        <p className="text-xs text-gray-500">{fee.studentId} • {fee.class}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{fee.amount}</td>
                    <td className="px-6 py-4 font-bold text-green-600">₹{fee.paidAmount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(fee.dueDate), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(fee.status)}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {userData?.role === 'admin' && (
                          <>
                            <button 
                              onClick={() => handleUpdatePayment(fee.id, fee.paidAmount, fee.amount)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Update Payment"
                            >
                              <CreditCard size={18} />
                            </button>
                            <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors" title="Send Reminder">
                              <Send size={18} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors" title="Download Receipt">
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFees.length === 0 && (
            <div className="py-20 text-center">
              <CreditCard size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No fee records found.</p>
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
                <h2 className="text-xl font-bold">Add Fee Record</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddFee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Student ID</label>
                    <input 
                      required
                      type="text" 
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Student Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Class</label>
                    <select 
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    >
                      {classes.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amount (₹)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Due Date</label>
                  <input 
                    required
                    type="date" 
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
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
                    Add Record
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
