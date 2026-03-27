import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
    ArrowLeft, Clock, MapPin, CheckCircle2, Circle, Package,
    ChefHat, ShieldCheck, Star, CreditCard, RefreshCw, Utensils, AlertCircle
} from 'lucide-react';

// --- Status config maps ---
const STATUS_STEPS = [
    { key: 'Pending',   label: 'Order Received',    sub: 'Your curation request is queued',         icon: Clock },
    { key: 'Accepted',  label: 'Accepted by Chef',  sub: 'Your order is confirmed in the kitchen',  icon: ShieldCheck },
    { key: 'Preparing', label: 'Being Prepared',    sub: 'Artisanal preparation in progress',       icon: ChefHat },
    { key: 'Ready',     label: 'Ready to Serve',    sub: 'Your flavours are arriving at the canvas', icon: Star },
    { key: 'Served',    label: 'Served',             sub: 'Enjoy your meal!',                        icon: Utensils },
    { key: 'Completed', label: 'Completed',          sub: 'Payment received. Thank you!',            icon: CreditCard },
];

const STATUS_COLORS = {
    Pending:   { bg: 'bg-amber-500',    text: 'text-amber-600',   light: 'bg-amber-50'   },
    Accepted:  { bg: 'bg-blue-500',     text: 'text-blue-600',    light: 'bg-blue-50'    },
    Preparing: { bg: 'bg-violet-500',   text: 'text-violet-600',  light: 'bg-violet-50'  },
    Ready:     { bg: 'bg-indigo-500',   text: 'text-indigo-600',  light: 'bg-indigo-50'  },
    Served:    { bg: 'bg-emerald-500',  text: 'text-emerald-600', light: 'bg-emerald-50' },
    Completed: { bg: 'bg-green-600',    text: 'text-green-700',   light: 'bg-green-50'   },
    Rejected:  { bg: 'bg-red-500',      text: 'text-red-600',     light: 'bg-red-50'     },
};

const getStepIndex = (status) => STATUS_STEPS.findIndex(s => s.key === status);

const OrderCard = ({ order }) => {
    const stepIndex = getStepIndex(order.status);
    const isRejected = order.status === 'Rejected';
    const isCompleted = order.status === 'Completed';
    const color = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden border border-on-surface/5 editorial-shadow"
        >
            {/* Card Header Banner */}
            <div className={`p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRejected ? 'bg-red-600' : isCompleted ? 'bg-green-600' : 'bg-primary'} text-white relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at top right, white 0%, transparent 60%)' }} />
                <div className="relative z-10">
                    <p className="text-[10px] font-black tracking-[0.25em] opacity-70 uppercase mb-1">Order Reference</p>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">#{order._id.slice(-6).toUpperCase()}</h2>
                    <div className="flex items-center gap-2 mt-2 opacity-80 text-sm font-semibold flex-wrap">
                        <MapPin size={14} />
                        <span>Table {order.tableNumber}</span>
                        <span className="opacity-40">·</span>
                        <Clock size={14} />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-end gap-3">
                    <div className="text-right">
                        <p className="text-[10px] font-black tracking-widest opacity-70 uppercase">Total Bill</p>
                        <p className="text-2xl font-black tracking-tighter">₹{order.totalAmount}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black tracking-widest uppercase backdrop-blur-sm border border-white/30">
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Items list (collapsible) */}
            <div className="px-5 sm:px-7 pt-5">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">Items</p>
                <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant">
                            {item.dishId?.name || 'Item'} × {item.quantity}
                        </span>
                    ))}
                </div>
            </div>

            {/* Rejected State */}
            {isRejected ? (
                <div className="flex items-center gap-4 mx-5 sm:mx-7 my-5 p-5 bg-red-50 rounded-2xl border border-red-100">
                    <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                    <div>
                        <h4 className="font-black text-red-700">Order Rejected</h4>
                        <p className="text-sm text-red-500 mt-0.5">We're sorry — please contact staff or place a new order.</p>
                    </div>
                </div>
            ) : (
                /* Timeline Steps */
                <div className="px-5 sm:px-7 py-6">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-5">Live Status</p>
                    <div className="relative flex flex-col gap-0">
                        {/* Vertical connector */}
                        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-surface-container-high" />

                        {STATUS_STEPS.map((step, i) => {
                            const isDone    = i < stepIndex;
                            const isCurrent = i === stepIndex;
                            const isPending = i > stepIndex;
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className="relative flex gap-5 items-start mb-6 last:mb-0">
                                    {/* Circle */}
                                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                                        ${isDone    ? 'bg-primary'                   : ''}
                                        ${isCurrent ? 'bg-white border-2 border-primary shadow-lg shadow-primary/20' : ''}
                                        ${isPending ? 'bg-surface-container-high'    : ''}
                                    `}>
                                        {isDone    && <CheckCircle2 size={16} className="text-white" />}
                                        {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                                        {isPending && <Circle size={14} className="text-on-surface-variant opacity-20" />}
                                    </div>

                                    {/* Content */}
                                    <div className={`pt-0.5 transition-all duration-500 ${isPending ? 'opacity-30' : ''}`}>
                                        <h4 className={`text-sm font-black ${isCurrent ? 'text-primary' : isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                            {step.label}
                                            {isCurrent && <span className="ml-2 text-[9px] font-black tracking-widest uppercase text-primary/60">← Now</span>}
                                        </h4>
                                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">{step.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
};


// --- Main Page ---
const OrderTracking = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const fetchOrders = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders/user`);
            // Show active orders (not completed/rejected) at top, then the rest
            const sorted = [...res.data].sort((a, b) => {
                const activeStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Served'];
                const aActive = activeStatuses.includes(a.status);
                const bActive = activeStatuses.includes(b.status);
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setOrders(sorted);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        // Listen for real-time order updates via socket
        const socketURL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'development' ? 'http://127.0.0.1:5000' : window.location.origin);
        const socket = io(socketURL);
        socket.on('orderUpdate', () => fetchOrders());

        return () => socket.disconnect();
    }, [fetchOrders]);

    const activeOrders  = orders.filter(o => !['Completed', 'Rejected'].includes(o.status));
    const pastOrders    = orders.filter(o =>  ['Completed', 'Rejected'].includes(o.status));

    return (
        <div className="min-h-screen bg-surface">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-on-surface/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-low flex items-center justify-center border-none flex-shrink-0"
                    >
                        <ArrowLeft size={20} className="text-on-surface" />
                    </button>

                    <div className="text-center">
                        <h1 className="text-base sm:text-lg font-black tracking-tight text-on-surface">Live Order Tracker</h1>
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Phase 03 / 03</span>
                    </div>

                    <button
                        onClick={fetchOrders}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-low flex items-center justify-center border-none flex-shrink-0 hover:bg-surface-container transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className="text-on-surface" />
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

                {/* Loading Skeleton */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-bold tracking-widest uppercase text-on-surface-variant">Fetching orders...</p>
                    </div>
                )}

                {/* No Orders Found */}
                {!loading && orders.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 gap-6 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center">
                            <Package size={36} className="text-on-surface-variant opacity-30" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-on-surface">No Active Orders</h3>
                            <p className="text-sm text-on-surface-variant mt-1 font-medium">Your orders will appear here after placement.</p>
                        </div>
                        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-2xl text-sm font-black tracking-widest uppercase">
                            Browse Menu
                        </button>
                    </motion.div>
                )}

                {/* Active Orders Section */}
                {!loading && activeOrders.length > 0 && (
                    <section className="flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h2 className="text-xs font-black tracking-widest uppercase text-on-surface-variant">
                                Active Orders ({activeOrders.length})
                            </h2>
                        </div>
                        <AnimatePresence mode="popLayout">
                            {activeOrders.map(order => <OrderCard key={order._id} order={order} />)}
                        </AnimatePresence>
                    </section>
                )}

                {/* Past Orders Section */}
                {!loading && pastOrders.length > 0 && (
                    <section className="flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-black tracking-widest uppercase text-on-surface-variant">
                                Past Orders ({pastOrders.length})
                            </h2>
                        </div>
                        <AnimatePresence mode="popLayout">
                            {pastOrders.map(order => <OrderCard key={order._id} order={order} />)}
                        </AnimatePresence>
                    </section>
                )}

                {/* Footer timestamp */}
                {!loading && orders.length > 0 && (
                    <p className="text-center text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">
                        Last updated · {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                )}
            </main>
        </div>
    );
};

export default OrderTracking;
