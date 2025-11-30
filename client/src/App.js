import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Register from './pages/Register';
import TakeExam from './pages/TakeExam';
import Results from './pages/Results'; // Keep for detailed result view
import MainLayout from './layouts/MainLayout';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminExams from './pages/Admin/Exams';
import AdminQuestions from './pages/Admin/Questions';
import AdminSubjects from './pages/Admin/Subjects';
import AdminUsers from './pages/Admin/Users';
import AdminResults from './pages/Admin/Results';
import AdminSettings from './pages/Admin/Settings';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import StudentHistory from './pages/Student/History';
import StudentProfile from './pages/Student/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (token) {
      setUser({ token, role, username });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('username', userData.username);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
  };

  const PrivateRoute = ({ children, role }) => {
    if (loading) return null; // Or a spinner
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;

    return (
      <MainLayout user={user} onLogout={handleLogout}>
        {children}
      </MainLayout>
    );
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* Public Routes - Full Screen */}
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" /> : <Register />
        } />

        {/* Admin Routes - With Sidebar Layout */}
        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/exams" element={
          <PrivateRoute role="admin">
            <AdminExams />
          </PrivateRoute>
        } />
        <Route path="/admin/questions" element={
          <PrivateRoute role="admin">
            <AdminQuestions />
          </PrivateRoute>
        } />
        <Route path="/admin/subjects" element={
          <PrivateRoute role="admin">
            <AdminSubjects />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute role="admin">
            <AdminUsers />
          </PrivateRoute>
        } />
        <Route path="/admin/results" element={
          <PrivateRoute role="admin">
            <AdminResults />
          </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute role="admin">
            <AdminSettings />
          </PrivateRoute>
        } />

        {/* Student Routes - With Sidebar Layout */}
        <Route path="/dashboard" element={
          <PrivateRoute role="student">
            <StudentDashboard />
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute role="student">
            <StudentHistory />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute role="student">
            <StudentProfile />
          </PrivateRoute>
        } />

        {/* Exam Taking & Detailed Result */}
        <Route path="/exam/:examId" element={
          <PrivateRoute role="student">
            <TakeExam />
          </PrivateRoute>
        } />

        <Route path="/results" element={
          <PrivateRoute role="student">
            <Results />
          </PrivateRoute>
        } />

        {/* Default Redirect */}
        <Route path="/" element={
          user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
