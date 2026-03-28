import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Homework from './components/Homework';
import Notice from './components/Notice';
import Attendance from './components/Attendance';
import Leave from './components/Leave';
import Fees from './components/Fees';
import Marks from './components/Marks';
import Profile from './components/Profile';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && userData && !roles.includes(userData.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="homework" element={<Homework />} />
        <Route path="notices" element={<Notice />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="fees" element={<Fees />} />
        <Route path="marks" element={<Marks />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<ProtectedRoute roles={['admin', 'teacher']}><UserManagement /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
