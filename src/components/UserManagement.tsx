import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function UserManagement() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',
    role: 'student',
    class: 'Class 6',
    phoneNumber: '',
    address: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, docId: doc.id };
      });
      setUsers(usersList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, you'd use Firebase Admin SDK to create the user in Auth
      // For this demo, we'll just add the document to Firestore
      // The user would then "claim" this account by logging in with the same email
      const newUser = {
        ...formData,
        uid: `temp_${Date.now()}`, // Temporary UID until they login
        createdAt: new Date().toISOString(),
      };
      
      if (isEditing) {
        const { docId, ...updateData } = isEditing;
        await updateDoc(doc(db, 'users', docId), formData);
        toast.success('User updated successfully');
      } else {
        await addDoc(collection(db, 'users'), newUser);
        toast.success('User added successfully');
      }
      
      setIsAddModalOpen(false);
      setIsEditing(null);
      setFormData({
        name: '', email: '', id: '', role: 'student', class: 'Class 6', phoneNumber: '', address: '',
      });
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed');
    }
  };

  const handleDeleteUser = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', docId));
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage students, teachers, and staff accounts.</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(null);
            setFormData({ name: '', email: '', id: '', role: 'student', class: 'Class 6', phoneNumber: '', address: '' });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all"
        >
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "px-4 py-3 rounded-2xl font-bold text-sm capitalize transition-all",
                roleFilter === role 
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <motion.div
              layout
              key={user.docId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#FF2D55] font-bold text-xl border border-gray-100">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-xs font-bold text-[#FF2D55] uppercase tracking-wider">{user.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setIsEditing(user);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        id: user.id,
                        role: user.role,
                        class: user.class || 'Class 6',
                        phoneNumber: user.phoneNumber || '',
                        address: user.address || '',
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.docId)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span>ID: {user.id}</span>
                  {user.class && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-bold">{user.class}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span>{user.phoneNumber || 'No phone'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <button className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  View Profile <ArrowRight size={12} />
                </button>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Active</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
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
                <h2 className="text-xl font-bold">{isEditing ? 'Edit User' : 'Add New User'}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ID / Roll No</label>
                    <input 
                      required
                      type="text" 
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'student' && (
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
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    {isEditing ? 'Update User' : 'Add User'}
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

function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
