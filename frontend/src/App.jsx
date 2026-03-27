import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './slices/authSlice';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import Dashboard from './pages/Dashboard';
import TableSelection from './pages/TableSelection';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOTPPage from './pages/admin/AdminOTPPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminTables from './pages/admin/AdminTables';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

// Components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import BottomNav from './components/BottomNav';

const AppContent = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitializing } = useSelector((state) => state.auth);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAuthPath = location.pathname.includes('/login') || location.pathname.includes('/verify-otp');

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Handle Real-Time Notifications Globablly
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // In production we proxy /socket.io through Vite, or rely on same origin
    const socketURL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'development' ? 'http://127.0.0.1:5000' : window.location.origin);
    const socket = io(socketURL);
    
    if (user.role === 'admin') {
      socket.on('newOrder', (order) => {
         if (order && order._id) {
           toast.success(`New Order #${order._id.slice(-6).toUpperCase()} received at Table ${order.tableNumber}!`);
         }
      });
    }

    if (user.role === 'user') {
      socket.on('orderUpdate', (updatedOrder) => {
         if (!updatedOrder) return;
         const belongsToUser = updatedOrder.userId === user._id || updatedOrder.userId?._id === user._id;
         if (belongsToUser) {
            toast(`Your order status is now: ${updatedOrder.status}`, { icon: '👏' });
            if (updatedOrder.status === 'Completed' || updatedOrder.status === 'Served') {
                toast.success('Your food is ready! Please proceed with payment.', { duration: 6000 });
            }
         }
      });
    }

    return () => socket.disconnect();
  }, [isAuthenticated, user]);

  if (isInitializing) {
     return (
        <div className="flex h-screen items-center justify-center bg-surface">
             <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
     );
  }

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/admin/login" />;
    if (user?.role !== 'admin') return <Navigate to="/" />;
    return (
      <div className="admin-layout flex flex-col md:flex-row min-h-screen bg-surface">
        <AdminHeader />
        <AdminSidebar />
        <div className="flex-1 transition-all duration-300 md:pl-64 pt-16 pb-24 md:pb-0">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container relative">
      <Toaster position="top-right" duration={3000} />
      {!isAdminPath && isAuthenticated && user?.role === 'user' && <Navbar />}
      {!isAdminPath && isAuthenticated && user?.role === 'user' && <BottomNav />}
      <CartDrawer />
      <Routes>
        {/* User Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OTPPage />} />
        
        {/* Protected User Routes */}
        <Route path="/" element={isAuthenticated ? (user?.role === 'admin' ? <Navigate to="/admin" /> : <Dashboard />) : <Navigate to="/login" />} />
        <Route path="/select-table" element={isAuthenticated ? <TableSelection /> : <Navigate to="/login" />} />
        <Route path="/order-success" element={isAuthenticated ? <OrderSuccess /> : <Navigate to="/login" />} />
        <Route path="/track-order" element={isAuthenticated ? <OrderTracking /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
        
        {/* Admin Auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/verify-otp" element={<AdminOTPPage />} />

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/menu" element={<AdminRoute><AdminMenu /></AdminRoute>} />
        <Route path="/admin/tables" element={<AdminRoute><AdminTables /></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
