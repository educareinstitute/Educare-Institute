import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { LogIn, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If it's the first time and not the admin email, we might need to handle registration
        // For this demo, we'll allow the admin email to auto-register as admin
        if (user.email === 'bettiahmart1@gmail.com') {
          toast.success('Welcome, Admin!');
          navigate('/');
        } else {
          // For others, they need to be added by an admin first
          // In a real app, you'd have a registration flow or pre-populated IDs
          toast.error('Access denied. Please contact the administrator.');
          await auth.signOut();
        }
      } else {
        toast.success(`Welcome back, ${userDoc.data().name}!`);
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login window was closed. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Login popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Login request was cancelled. Please try again.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200 overflow-hidden"
      >
        <div className="p-8 text-center bg-[#FF2D55] text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">EDUCARE INSTITUTE</h1>
          <p className="text-white/80 text-sm mt-1">Coaching Management System</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to access your dashboard</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Or use ID Login</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Roll No / ID</label>
                <input 
                  type="text" 
                  placeholder="Enter your ID"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#FF2D55] focus:bg-white rounded-xl transition-all outline-none"
                />
              </div>
              <button
                disabled={true}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
              >
                Sign In
              </button>
              <p className="text-center text-xs text-gray-400">
                ID Login is currently disabled. Please use Google Login.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            © 2026 Educare Institute. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
