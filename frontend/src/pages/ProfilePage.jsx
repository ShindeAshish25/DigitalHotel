import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Smartphone, Mail, ChevronRight, Package, Calendar, Settings, LogOut } from 'lucide-react';
import { loadUser, logoutUser } from '../slices/authSlice';

const ProfilePage = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders/user`);
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch order history", err);
            }
        };
        fetchHistory();
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/profile/update`, formData);
            dispatch(loadUser());
            setEditMode(false);
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const data = new FormData();
        data.append('avatar', file);
        setUploading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/profile/upload`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            dispatch(loadUser());
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* 1. STICKY HEADER SECTION */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-on-surface/5 bg-surface/80 backdrop-blur-xl">
                <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col"
                    >
                        <span className="text-[9px] md:text-[10px] font-black text-primary tracking-[0.3em] uppercase leading-none mb-1">
                            Editorial Identity
                        </span>
                        <h1 className="text-xl md:text-2xl font-serif font-light tracking-tight text-on-surface">
                            Personal <span className="text-primary italic">Curatory</span>
                        </h1>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-on-surface text-surface rounded-full text-[10px] font-black tracking-widest uppercase transition-all hover:bg-primary"
                        >
                            <span className="hidden sm:inline">Sign Out</span>
                            <LogOut size={14} />
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* 2. MAIN CONTENT AREA (Padded for Header) */}
            <main className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Profile Identity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="editorial-shadow lg:col-span-5 bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 h-fit border border-on-surface/5"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-surface-container-low flex items-center justify-center overflow-hidden border border-surface-container-high shadow-inner">
                                {user?.avatarUrl ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${user.avatarUrl}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <User size={40} className="text-primary opacity-40" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border-4 border-surface-container-lowest hover:scale-105 transition-transform shadow-lg">
                                <Camera size={18} />
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                            {uploading && (
                                <div className="absolute inset-0 rounded-[2rem] bg-surface-container-lowest/80 flex items-center justify-center backdrop-blur-sm">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                </div>
                            )}
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface">{user?.name}</h2>
                            <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-surface-container-low rounded-full text-xs font-bold text-on-surface-variant border border-on-surface/5">
                                <Smartphone size={12} className="text-primary" /> {user?.mobile}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <AnimatePresence mode="wait">
                            {editMode ? (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="flex flex-col gap-3"
                                >
                                    <input className="w-full px-5 py-4 bg-surface-container-low rounded-2xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
                                    <input className="w-full px-5 py-4 bg-surface-container-low rounded-2xl border-none outline-none focus:ring-2 ring-primary/20 transition-all font-bold text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email Address" />
                                    <button className="w-full py-4 mt-2 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-[10px] shadow-lg shadow-primary/20" onClick={handleUpdate}>Save Identity</button>
                                    <button onClick={() => setEditMode(false)} className="py-2 text-[10px] font-black text-on-surface-variant/40 hover:text-primary transition-colors uppercase tracking-widest">Discard</button>
                                </motion.div>
                            ) : (
                                <motion.div key="view" className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-5 bg-surface-container-low/50 rounded-3xl group cursor-pointer border border-transparent hover:border-primary/10 transition-all" onClick={() => setEditMode(true)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                                                <Mail size={18} className="text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest">Email</span>
                                                <span className="text-sm font-bold truncate max-w-[150px]">{user?.email || 'Not set'}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-on-surface-variant opacity-30 group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <div className="flex items-center gap-4 p-5 bg-surface-container-low/30 rounded-3xl opacity-50 grayscale border border-dashed border-on-surface/10">
                                        <Calendar size={18} className="text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Registry Date</span>
                                            <span className="text-sm font-bold uppercase tracking-tighter">March 2026</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Editorial Archive - Bento Item */}
                <div className="editorial-shadow lg:col-span-7 bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 h-fit lg:min-h-[600px] border border-on-surface/5">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase opacity-60">Archive</span>
                            <h3 className="text-3xl font-serif italic text-on-surface">Curation History</h3>
                        </div>
                        <div className="px-4 py-2 bg-on-surface text-surface rounded-full text-[9px] font-black tracking-widest">
                            {orders.length} ITEMS
                        </div>
                    </div>

                    <div className="no-scrollbar overflow-y-auto flex flex-col gap-4 max-h-[500px] lg:max-h-none">
                        {orders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4 py-20 border-2 border-dashed border-on-surface/10 rounded-[2rem]">
                                <Package size={64} strokeWidth={1} />
                                <p className="text-xs font-black tracking-widest uppercase text-center">No curations yet.</p>
                            </div>
                        ) : (
                            orders.map((order, idx) => (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface-container-low/40 rounded-[2rem] hover:bg-on-surface hover:text-surface transition-all duration-500 border border-on-surface/5"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform">
                                            <Utensils size={24} className="text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-lg font-black tracking-tighter">#{order._id.slice(-6).toUpperCase()}</h4>
                                            <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-surface/60 uppercase tracking-wider">
                                                Table {order.tableNumber} • {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-on-surface/5">
                                        <div className="text-left sm:text-right">
                                            <span className="text-xl font-black tracking-tighter italic">₹{order.totalAmount}</span>
                                            <div className="flex items-center gap-2 sm:justify-end mt-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-primary'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'text-green-500' : 'text-primary'} group-hover:text-surface`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                        <Settings size={20} className="text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const Utensils = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
);

export default ProfilePage;