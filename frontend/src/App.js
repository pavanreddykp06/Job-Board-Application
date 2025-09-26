import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';


import Layout from './components/layout/Layout';


import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';


import JobSeekerDashboard from './components/dashboard/JobSeekerDashboard';
import EmployerDashboard from './components/dashboard/EmployerDashboard';
import MessagingPage from './components/messaging/MessagingPage';


import JobDetail from './components/jobs/JobDetail';
import ApplyJob from './components/jobs/ApplyJob';
import BrowseJobs from './components/jobs/BrowseJobs';
import ManageJobs from './components/jobs/ManageJobs';
import ViewApplications from './components/jobs/ViewApplications';
import PostJob from './components/jobs/PostJob';
import MyApplications from './components/jobs/MyApplications';

// Profile Component
import UserProfile from './components/profile/UserProfile';
import EmployerProfile from './components/profile/EmployerProfile';

// Messaging and Notification Components
import MessagingCenter from './components/messaging/MessagingCenter';
import NotificationCenter from './components/notifications/NotificationCenter';

// Home Component
import Home from './components/Home';
import NotFound from './components/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/reset-password/:uidb64/:token" element={<Layout><ResetPassword /></Layout>} />
      <Route path="/browse-jobs" element={<Layout><BrowseJobs /></Layout>} />
      <Route path="/job/:id" element={<Layout><JobDetail /></Layout>} />
      
      {/* Protected Routes - Job Seeker */}
      <Route 
        path="/job-seeker/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Layout><JobSeekerDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/job/:id/apply" 
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Layout><ApplyJob /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/job-seeker/applications" 
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Layout><MyApplications /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/job-seeker/profile" 
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Layout><UserProfile /></Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/job-seeker/notifications" 
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Layout><NotificationCenter /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Employer */}
      <Route 
        path="/employer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><EmployerDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/manage-jobs" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><ManageJobs /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/jobs/:jobId/applications" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><ViewApplications /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/post-job" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><PostJob /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/applications/:id" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><ViewApplications /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/profile" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><EmployerProfile /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <Layout><MessagingPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer/notifications" 
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Layout><NotificationCenter /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all Route - 404 Not Found */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}

export default App;
