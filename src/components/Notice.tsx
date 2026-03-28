import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  X,
  User,
  Clock,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Notice() {
  const { userData } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: ['student', 'teacher'],
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setNotices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await addDoc(collection(db, 'notices'), {
        ...formData,
        senderId: userData.uid,
        senderName: userData.name,
        createdAt: new Date().toISOString(),
      });

      toast.success('Notice sent successfully');
      setIsAddModalOpen(false);
      setFormData({ title: '', content: '', targetRoles: ['student', 'teacher'] });
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send notice');
    }
  };

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-500 text-sm">Stay updated with the latest announcements.</p>
        </div>
        {(userData?.role === 'teacher' || userData?.role === 'admin') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
          >
            <Send size={20} />
            Post Notice
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search notices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none"
        />
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice, i) => (
            <motion.div
              layout
              key={notice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FF2D55] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                    {i === 0 && <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">New</span>}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock size={14} />
                    {format(new Date(notice.createdAt), 'MMM d, yyyy • h:mm a')}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF2D55]">
                    <User size={14} />
                    Posted by: {notice.senderName}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredNotices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell size={40} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No notices found</h3>
              <p className="text-gray-500 text-sm">Everything is quiet for now.</p>
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
                <h2 className="text-xl font-bold">Post New Notice</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddNotice} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Holiday Announcement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Content</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Write your announcement here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Target Audience</label>
                  <div className="flex gap-4">
                    {['student', 'teacher', 'admin'].map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.targetRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, targetRoles: [...formData.targetRoles, role] });
                            } else {
                              setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role) });
                            }
                          }}
                          className="w-4 h-4 text-[#FF2D55] rounded focus:ring-[#FF2D55]"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{role}s</span>
                      </label>
                    ))}
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
                    Post Notice
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
