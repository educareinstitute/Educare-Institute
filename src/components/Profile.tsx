import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Shield, 
  GraduationCap,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

export default function Profile() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phoneNumber: userData?.phoneNumber || '',
    address: userData?.address || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `profiles/${userData.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      await updateDoc(doc(db, 'users', userData.uid), { photoURL: url });
      toast.success('Photo updated successfully');
      window.location.reload(); // Refresh to show new photo
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-3xl bg-gray-100 overflow-hidden border-4 border-[#FF2D55]/10">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#FF2D55] text-4xl font-bold">
                    {userData?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FF2D55] text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#E6294D] transition-all">
                <Camera size={20} />
                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
              </label>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{userData?.name}</h2>
            <p className="text-sm font-bold text-[#FF2D55] uppercase tracking-wider mt-1">{userData?.role}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500">
              <Shield size={12} />
              ID: {userData?.id}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-[#FF2D55]" />
              Academic Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Class</span>
                <span className="font-bold text-gray-700">{userData?.class || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Section</span>
                <span className="font-bold text-gray-700">A</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Session</span>
                <span className="font-bold text-gray-700">2025-26</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="flex-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={24} className="text-[#FF2D55]" />
              Personal Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      disabled
                      type="email" 
                      value={userData?.email}
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                  <textarea 
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FF2D55] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-[#E6294D] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
