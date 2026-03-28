import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  ImageIcon, 
  Paperclip,
  X,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface HomeworkFormData {
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  attachments: File[];
}

export default function Homework() {
  const { userData } = useAuth();
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  const [formData, setFormData] = useState<HomeworkFormData>({
    title: '',
    description: '',
    subject: 'Mathematics',
    class: 'Class 6',
    dueDate: '',
    attachments: [],
  });

  const subjects = userData?.role === 'student' 
    ? (userData.class?.includes('11') || userData.class?.includes('12') 
        ? ['Physics', 'Chemistry', 'Mathematics'] 
        : ['Mathematics', 'Science', 'Social Science', 'English'])
    : ['Mathematics', 'Science', 'Social Science', 'English', 'Physics', 'Chemistry'];

  const fetchHomework = async () => {
    setLoading(true);
    try {
      let q;
      if (userData?.role === 'student') {
        q = query(
          collection(db, 'homework'), 
          where('class', '==', userData.class),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'homework'), 
          orderBy('createdAt', 'desc')
        );
      }
      const querySnapshot = await getDocs(q);
      setHomeworks(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [userData]);

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      const attachmentUrls = [];
      for (const file of formData.attachments) {
        const storageRef = ref(storage, `homework/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        attachmentUrls.push(url);
      }

      await addDoc(collection(db, 'homework'), {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        class: formData.class,
        dueDate: formData.dueDate,
        teacherId: userData.uid,
        teacherName: userData.name,
        attachments: attachmentUrls,
        createdAt: new Date().toISOString(),
      });

      toast.success('Homework added successfully');
      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', subject: 'Mathematics', class: 'Class 6', dueDate: '', attachments: [] });
      fetchHomework();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add homework');
    }
  };

  const filteredHomework = homeworks.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         hw.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || hw.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
          <p className="text-gray-500 text-sm">View and manage daily assignments.</p>
        </div>
        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
          >
            <Plus size={20} />
            Assign Homework
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search homework..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['All', ...subjects].map((subject) => (
            <button
              key={subject}
              onClick={() => setSubjectFilter(subject)}
              className={`px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                subjectFilter === subject 
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map((hw) => (
            <motion.div
              layout
              key={hw.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {hw.subject}
                    </span>
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-bold rounded-full uppercase tracking-wider">
                      {hw.class}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{hw.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{hw.description}</p>
                  
                  {hw.attachments && hw.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {hw.attachments.map((url: string, i: number) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Paperclip size={14} />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:text-right space-y-2 shrink-0">
                  <div className="flex items-center md:justify-end gap-2 text-sm font-bold text-red-500">
                    <Clock size={16} />
                    Due: {format(new Date(hw.dueDate), 'MMM d, yyyy')}
                  </div>
                  <p className="text-xs text-gray-400">Assigned by: {hw.teacherName}</p>
                  <div className="pt-4">
                    <button className="w-full md:w-auto px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
                      Mark as Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredHomework.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={40} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No homework found</h3>
              <p className="text-gray-500 text-sm">Check back later for new assignments.</p>
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
                <h2 className="text-xl font-bold">Assign Homework</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddHomework} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Algebra Practice Set 1"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                  />
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
                      <option>Class 6</option>
                      <option>Class 7</option>
                      <option>Class 8</option>
                      <option>Class 9</option>
                      <option>Class 10</option>
                      <option>Class 11 PCM</option>
                      <option>Class 12 PCM</option>
                    </select>
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Provide detailed instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Attachments (Images/PDFs)</label>
                  <input 
                    type="file" 
                    multiple
                    onChange={(e) => setFormData({ ...formData, attachments: Array.from(e.target.files || []) })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF2D55] file:text-white hover:file:bg-[#E6294D]"
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
                    Assign
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
