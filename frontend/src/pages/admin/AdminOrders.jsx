import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    ChefHat, 
    ShoppingBag, 
    MoreVertical,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, ready: 0, avgTime: 18 });
    const [receiptOrder, setReceiptOrder] = useState(null);

    const playNotification = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            g.gain.value = 0.08;
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            setTimeout(() => {
                o.stop();
                ctx.close();
            }, 180);
        } catch {
            // no-op
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`);
            const allOrders = res.data;
            setOrders(allOrders);
            
            const pending = allOrders.filter(o => o.status === 'Pending').length;
            const inProgress = allOrders.filter(o => o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'Serving').length;
            const ready = allOrders.filter(o => o.status === 'Ready').length;
            
            setStats(prev => ({ ...prev, pending, inProgress, ready }));
        } catch (err) {
            console.error("Orders fetch error:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        socket.on('orderUpdate', fetchOrders);
        socket.on('newOrder', () => {
            playNotification();
            fetchOrders();
        });
        return () => {
            socket.off('orderUpdate', fetchOrders);
            socket.off('newOrder');
        };
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/orders/${id}/status`, { status });
            fetchOrders();
        } catch (err) {
            console.error("Status update error:", err);
        }
    };

    const generateBill = async (id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/orders/${id}/bill`);
            setReceiptOrder(res.data.order);
            fetchOrders();
        } catch (err) {
            console.error("Billing error:", err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-secondary-container text-on-secondary-container border-secondary';
            case 'Accepted':
            case 'Preparing': return 'bg-primary/10 text-primary border-primary';
            case 'Ready': return 'bg-tertiary-container/20 text-tertiary-container border-tertiary';
            case 'Served': return 'bg-surface-container-high text-on-surface-variant opacity-60';
            default: return 'bg-surface-container text-on-surface-variant';
        }
    };

    return (
        <main className="flex-1 px-4 md:px-10 py-8 bg-surface">
            <header className="mb-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Live Orders Management</h2>
                <p className="text-on-surface-variant max-w-2xl">Monitor and manage real-time culinary requests from the dining floor. Efficiency is the key ingredient.</p>
            </header>

            {/* Stats Overview */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Pending</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-secondary">{stats.pending.toString().padStart(2, '0')}</span>
                        <span className="text-tertiary-container text-xs font-bold pb-1 flex items-center">
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Live
                        </span>
                    </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">In Progress</span>
                    <span className="text-4xl font-black text-primary">{stats.inProgress.toString().padStart(2, '0')}</span>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Ready</span>
                    <span className="text-4xl font-black text-tertiary">{stats.ready.toString().padStart(2, '0')}</span>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Avg Time</span>
                    <span className="text-4xl font-black text-on-surface">{stats.avgTime}<span className="text-lg font-medium">m</span></span>
                </div>
            </section>

            {/* Orders Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
                <AnimatePresence mode="popLayout">
                    {orders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected').map((order) => (
                        <motion.div 
                            key={order._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`bg-surface-container-lowest rounded-2xl p-6 border-l-4 shadow-sm flex flex-col gap-6 transition-all ${getStatusColor(order.status)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block bg-current/10">
                                        {order.status}
                                    </span>
                                    <h3 className="text-xl font-bold text-on-surface">Order #{order._id.slice(-6).toUpperCase()}</h3>
                                    <p className="text-sm text-on-surface-variant font-medium">
                                        Table {order.tableNumber || '??'} • Guest: {order.userId?.name || 'Guest'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-on-surface-variant block mb-1">Time Elapsed</span>
                                    <span className={`text-lg font-mono font-bold ${order.status === 'Pending' ? 'text-secondary' : 'text-primary'}`}>
                                        {Math.floor((new Date() - new Date(order.createdAt)) / 60000)}:{(Math.floor((new Date() - new Date(order.createdAt)) / 1000) % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 py-4 border-y border-surface-variant/30 flex-grow">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-xs">
                                                {item.quantity}x
                                            </span>
                                            <span className="font-semibold text-on-surface">{item.dishId?.name || 'Item'}</span>
                                        </div>
                                        <span className="text-sm text-on-surface-variant">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                {order.notes && (
                                    <div className="bg-surface-container-low p-3 rounded-lg text-xs text-on-surface-variant italic flex gap-2">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>"{order.notes}"</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-auto">
                                <div>
                                    <span className="text-xs text-on-surface-variant block uppercase tracking-tighter">Total Price</span>
                                    <span className="text-2xl font-black text-on-surface">₹{order.totalAmount}</span>
                                </div>
                                <div className="flex gap-2">
                                    {order.status === 'Pending' && (
                                        <>
                                            <button onClick={() => updateStatus(order._id, 'Rejected')} className="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Reject</button>
                                            <button onClick={() => updateStatus(order._id, 'Accepted')} className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-transform">Accept Order</button>
                                        </>
                                    )}
                                    {order.status === 'Accepted' && (
                                        <button onClick={() => updateStatus(order._id, 'Preparing')} className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform">Start Preparing</button>
                                    )}
                                    {order.status === 'Preparing' && (
                                        <button onClick={() => updateStatus(order._id, 'Ready')} className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform">Mark Ready</button>
                                    )}
                                    {order.status === 'Ready' && (
                                        <button onClick={() => updateStatus(order._id, 'Served')} className="bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform">Mark Served</button>
                                    )}
                                    {order.status === 'Served' && (
                                        <button onClick={() => generateBill(order._id)} className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform">Payment & Bill</button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {/* Manual Entry Placeholder */}
                <div className="bg-dashed border-2 border-dashed border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-60 transition-opacity cursor-pointer">
                    <ShoppingBag size={48} className="mb-4 text-on-surface-variant" />
                    <p className="font-bold text-lg">Manual Entry</p>
                    <p className="text-xs">Create order for walk-ins</p>
                </div>
            </div>

            {/* Receipt Modal */}
            <AnimatePresence>
                {receiptOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="bg-primary p-8 text-white text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-1">Payment Received</h3>
                                <p className="text-white/70 text-sm">Order #{receiptOrder._id.slice(-6).toUpperCase()}</p>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="border-b border-dashed border-outline-variant pb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-on-surface-variant font-medium">Table Number</span>
                                        <span className="font-bold">Table {receiptOrder.tableNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-on-surface-variant font-medium">Guest Name</span>
                                        <span className="font-bold">{receiptOrder.userId?.name || 'Guest'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {receiptOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-on-surface">{item.quantity}x {item.dishId?.name || 'Item'}</span>
                                            <span className="font-bold text-on-surface">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-surface-variant flex justify-between items-center">
                                    <span className="text-lg font-bold">Total Amount</span>
                                    <span className="text-2xl font-black text-primary">₹{receiptOrder.totalAmount}</span>
                                </div>

                                <button 
                                    onClick={() => setReceiptOrder(null)}
                                    className="w-full bg-on-surface text-surface py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                                >
                                    Dismiss Receipt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Refresh FAB */}
            <div className="fixed bottom-28 right-6 md:bottom-8 md:right-8 z-40">
                <motion.button 
                    whileTap={{ rotate: 180 }}
                    onClick={fetchOrders}
                    className="w-14 h-14 bg-secondary text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                    <RefreshCw size={24} />
                </motion.button>
            </div>
        </main>
    );
};

export default AdminOrders;
