import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, setDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Attendance() {
  const { userData } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState('Class 6');

  const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 PCM', 'Class 12 PCM'];

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      if (userData?.role === 'student') {
        const q = query(
          collection(db, 'attendance'), 
          where('studentId', '==', userData.uid),
          where('date', '>=', format(startOfMonth(selectedDate), 'yyyy-MM-dd')),
          where('date', '<=', format(endOfMonth(selectedDate), 'yyyy-MM-dd'))
        );
        const querySnapshot = await getDocs(q);
        setAttendance(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        // Fetch students for the selected class
        const studentsQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'student'),
          where('class', '==', selectedClass)
        );
        const studentsSnap = await getDocs(studentsQuery);
        setStudents(studentsSnap.docs.map(doc => ({ ...doc.data(), docId: doc.id })));

        // Fetch attendance for the selected date and class
        const attendanceQuery = query(
          collection(db, 'attendance'), 
          where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
          where('class', '==', selectedClass)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        setAttendance(attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [userData, selectedDate, selectedClass]);

  const handleMarkAttendance = async (studentId: string, studentName: string, status: string) => {
    if (!userData) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const attendanceId = `${studentId}_${dateStr}`;

    try {
      await setDoc(doc(db, 'attendance', attendanceId), {
        studentId,
        studentName,
        class: selectedClass,
        date: dateStr,
        status,
        markedBy: userData.name,
        createdAt: new Date().toISOString(),
      });
      
      toast.success(`Marked ${studentName} as ${status}`);
      fetchAttendanceData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'text-green-600 bg-green-50';
      case 'Absent': return 'text-red-600 bg-red-50';
      case 'Holiday': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': return <CheckCircle2 size={18} />;
      case 'Absent': return <XCircle size={18} />;
      case 'Holiday': return <MinusCircle size={18} />;
      default: return null;
    }
  };

  if (userData?.role === 'student') {
    const days = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-gray-900 min-w-[120px] text-center">
              {format(selectedDate, 'MMMM yyyy')}
            </span>
            <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase py-2">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const record = attendance.find(a => a.date === format(day, 'yyyy-MM-dd'));
            return (
              <div 
                key={i} 
                className={`aspect-square rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1 transition-all ${
                  record ? getStatusColor(record.status) : 'bg-white text-gray-400'
                } ${isSameDay(day, new Date()) ? 'ring-2 ring-[#FF2D55] ring-offset-2' : ''}`}
              >
                <span className="text-sm font-bold">{format(day, 'd')}</span>
                {record && getStatusIcon(record.status)}
              </div>
            );
          })}
        </div>

        <div className="flex gap-6 pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Present
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <div className="w-3 h-3 rounded-full bg-red-500"></div> Absent
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Holiday
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 text-sm">Select class and date to mark student attendance.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF2D55] focus:border-transparent transition-all shadow-sm outline-none appearance-none font-bold text-gray-700"
          >
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronRight size={18} className="rotate-90" />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors md:hidden">
            <ChevronLeft size={20} />
          </button>
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="bg-transparent border-none focus:ring-0 font-bold text-gray-900 p-2"
          />
          <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors md:hidden">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((student) => {
              const record = attendance.find(a => a.studentId === student.uid);
              return (
                <tr key={student.docId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#FF2D55] font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{student.id}</td>
                  <td className="px-6 py-4">
                    {record ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider italic">Not Marked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleMarkAttendance(student.uid, student.name, 'Present')}
                        className={`p-2 rounded-xl transition-all ${record?.status === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button 
                        onClick={() => handleMarkAttendance(student.uid, student.name, 'Absent')}
                        className={`p-2 rounded-xl transition-all ${record?.status === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                      >
                        <XCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleMarkAttendance(student.uid, student.name, 'Holiday')}
                        className={`p-2 rounded-xl transition-all ${record?.status === 'Holiday' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                      >
                        <MinusCircle size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="py-20 text-center">
            <UserCheck size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No students found in this class.</p>
          </div>
        )}
      </div>
    </div>
  );
}
