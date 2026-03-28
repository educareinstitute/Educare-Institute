import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCheck, 
  BookOpen, 
  Bell, 
  CreditCard, 
  GraduationCap, 
  CalendarDays,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: 'Mon', attendance: 95 },
  { name: 'Tue', attendance: 92 },
  { name: 'Wed', attendance: 88 },
  { name: 'Thu', attendance: 94 },
  { name: 'Fri', attendance: 90 },
  { name: 'Sat', attendance: 85 },
];

export default function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData) return;

      try {
        // Fetch stats based on role
        const noticesQuery = query(
          collection(db, 'notices'), 
          orderBy('createdAt', 'desc'), 
          limit(3)
        );
        const noticesSnap = await getDocs(noticesQuery);
        setRecentNotices(noticesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (userData.role === 'student') {
          // Student specific stats
          const homeworkQuery = query(collection(db, 'homework'), where('class', '==', userData.class), limit(5));
          const homeworkSnap = await getDocs(homeworkQuery);
          
          const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', userData.uid));
          const attendanceSnap = await getDocs(attendanceQuery);
          const attendanceCount = attendanceSnap.size;
          const presentCount = attendanceSnap.docs.filter(doc => doc.data().status === 'Present').length;
          const attendancePercentage = attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0;

          setStats({
            homework: homeworkSnap.size,
            attendance: attendancePercentage,
            notices: noticesSnap.size,
            marks: 85, // Mock for now
          });
        } else {
          // Teacher/Admin stats
          const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
          const studentsSnap = await getDocs(studentsQuery);
          
          const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
          const teachersSnap = await getDocs(teachersQuery);

          setStats({
            students: studentsSnap.size,
            teachers: teachersSnap.size,
            notices: noticesSnap.size,
            attendance: 92, // Mock average for today
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userData]);

  if (loading) return <div className="flex h-full items-center justify-center">Loading Dashboard...</div>;

  const studentStats = [
    { name: 'Attendance', value: `${stats.attendance}%`, icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { name: 'Homework', value: stats.homework, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { name: 'Notices', value: stats.notices, icon: Bell, color: 'bg-orange-50 text-orange-600' },
    { name: 'Avg Marks', value: `${stats.marks}%`, icon: GraduationCap, color: 'bg-purple-50 text-purple-600' },
  ];

  const adminStats = [
    { name: 'Total Students', value: stats.students, icon: GraduationCap, color: 'bg-blue-50 text-blue-600' },
    { name: 'Total Teachers', value: stats.teachers, icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { name: 'Notices', value: stats.notices, icon: Bell, color: 'bg-orange-50 text-orange-600' },
    { name: 'Avg Attendance', value: `${stats.attendance}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  const currentStats = userData?.role === 'student' ? studentStats : adminStats;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Hello, {userData?.name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening at Educare today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <CalendarDays size={18} className="text-[#FF2D55]" />
          {format(new Date(), 'EEEE, MMMM do')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {currentStats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">Attendance Overview</h3>
            <select className="text-sm bg-gray-50 border-none rounded-lg px-3 py-1.5 focus:ring-0 font-medium">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="attendance" radius={[6, 6, 6, 6]} barSize={32}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.attendance > 90 ? '#FF2D55' : '#4B5563'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Notices</h3>
            <Link to="/notices" className="text-[#FF2D55] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{notice.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notice.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-bold text-[#FF2D55] uppercase tracking-wider">{notice.senderName}</span>
                    <span className="text-[10px] text-gray-400">{format(new Date(notice.createdAt), 'MMM d')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Bell size={48} className="text-gray-200 mb-4" />
                <p className="text-sm text-gray-400">No recent notices</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#FF2D55] to-[#FF5E7D] p-6 rounded-3xl text-white shadow-lg shadow-red-100">
          <h3 className="text-lg font-bold mb-2">Fee Reminder</h3>
          <p className="text-white/80 text-sm mb-4">Your next installment is due on April 15th.</p>
          <button className="bg-white text-[#FF2D55] px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            Pay Now
          </button>
        </div>
        <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-lg shadow-gray-200">
          <h3 className="text-lg font-bold mb-2">Exam Schedule</h3>
          <p className="text-white/80 text-sm mb-4">Final exams for Class 10 start from May 1st.</p>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            View Schedule
          </button>
        </div>
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-100">
          <h3 className="text-lg font-bold mb-2">Leave Request</h3>
          <p className="text-white/80 text-sm mb-4">Need a break? Submit your leave request here.</p>
          <Link to="/leave" className="inline-block bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
