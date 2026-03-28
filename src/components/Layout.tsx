import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bell, 
  UserCheck, 
  CalendarDays, 
  CreditCard, 
  GraduationCap, 
  Users, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
  { name: 'Homework', path: '/homework', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
  { name: 'Notices', path: '/notices', icon: Bell, roles: ['student', 'teacher', 'admin'] },
  { name: 'Attendance', path: '/attendance', icon: UserCheck, roles: ['student', 'teacher', 'admin'] },
  { name: 'Leave System', path: '/leave', icon: CalendarDays, roles: ['student', 'teacher', 'admin'] },
  { name: 'Fees', path: '/fees', icon: CreditCard, roles: ['student', 'admin'] },
  { name: 'Marks', path: '/marks', icon: GraduationCap, roles: ['student', 'teacher', 'admin'] },
  { name: 'User Management', path: '/users', icon: Users, roles: ['teacher', 'admin'] },
  { name: 'Profile', path: '/profile', icon: User, roles: ['student', 'teacher', 'admin'] },
];

export default function Layout() {
  const { userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    userData && item.roles.includes(userData.role)
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF2D55] rounded-lg flex items-center justify-center text-white font-bold text-xl">
            E
          </div>
          <h1 className="text-xl font-bold text-gray-900">EDUCARE</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === item.path
                  ? "bg-[#FF2D55] text-white shadow-lg shadow-red-100"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-[#FF2D55] rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900">{userData?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-[#FF2D55]">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#FF2D55] font-bold">
                  {userData?.name?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF2D55] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    E
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">EDUCARE</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-[#FF2D55] text-white shadow-lg shadow-red-100"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-[#FF2D55] rounded-xl transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
