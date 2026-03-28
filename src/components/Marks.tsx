import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  X,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MarkFormData {
  studentId: string;
  studentName: string;
  class: string;
  subject: string;
  testName: string;
  marksObtained: number;
  maxMarks: number;
}

export default function Marks() {
  const { userData } = useAuth();
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<MarkFormData>({
    studentId: '',
    studentName: '',
    class: 'Class 6',
    subject: 'Mathematics',
    testName: '',
    marksObtained: 0,
    maxMarks: 100,
  });

  const subjects = ['Mathematics', 'Science', 'Social Science', 'English', 'Physics', 'Chemistry'];
  const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 PCM', 'Class 12 PCM'];

  const fetchMarks = async () => {
    setLoading(true);
    try {
      let q;
      if (userData?.role === 'student') {
        q = query(
          collection(db, 'marks'), 
          where('studentId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'marks'), 
          orderBy('createdAt', 'desc')
        );
      }
      const querySnapshot = await getDocs(q);
      setMarks(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch marks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [userData]);

  const handleAddMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await addDoc(collection(db, 'marks'), {
        ...formData,
        createdAt: new Date().toISOString(),
      });

      toast.success('Marks uploaded successfully');
      setIsAddModalOpen(false);
      setFormData({ studentId: '', studentName: '', class: 'Class 6', subject: 'Mathematics', testName: '', marksObtained: 0, maxMarks: 100 });
      fetchMarks();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload marks');
    }
  };

  const filteredMarks = marks.filter(mark => 
    mark.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    mark.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mark.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks & Tests</h1>
          <p className="text-gray-500 text-sm">Track academic performance and test results.</p>
        </div>
        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
          >
            <Plus size={20} />
            Upload Marks
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by student, subject or test..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none"
        />
      </div>

      {/* Marks List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarks.map((mark, i) => {
            const percentage = Math.round((mark.marksObtained / mark.maxMarks) * 100);
            return (
              <motion.div
                layout
                key={mark.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#FF2D55] font-bold border border-gray-100">
                    <BookOpen size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${percentage >= 80 ? 'bg-green-50 text-green-600' : (percentage >= 40 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600')}`}>
                    {percentage}%
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-lg">{mark.testName}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF2D55] uppercase tracking-wider">
                    {mark.subject}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score</p>
                    <p className="text-xl font-bold text-gray-900">{mark.marksObtained}<span className="text-sm text-gray-400 font-medium"> / {mark.maxMarks}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</p>
                    <p className="text-sm font-bold text-gray-700">{mark.studentName}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Award size={14} className="text-yellow-500" />
                    <span>{percentage >= 80 ? 'Excellent' : (percentage >= 60 ? 'Good' : 'Needs Improvement')}</span>
                  </div>
                  <span>{format(new Date(mark.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </motion.div>
            );
          })}
          {filteredMarks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <GraduationCap size={40} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No marks recorded</h3>
              <p className="text-gray-500 text-sm">Test results will appear here.</p>
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
                <h2 className="text-xl font-bold">Upload Test Marks</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMarks} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Subject</label>
                    <select 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Class</label>
                    <select 
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    >
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Test Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Mid-Term Examination 2026"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Marks Obtained</label>
                    <input 
                      required
                      type="number" 
                      value={formData.marksObtained}
                      onChange={(e) => setFormData({ ...formData, marksObtained: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Max Marks</label>
                    <input 
                      required
                      type="number" 
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
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
                    Upload
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
