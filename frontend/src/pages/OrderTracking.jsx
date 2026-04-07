import React, { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
    ArrowLeft, Clock, MapPin, CheckCircle2, Circle, Package,
    ChefHat, ShieldCheck, CreditCard, RefreshCw, AlertCircle, Receipt
} from 'lucide-react';

// ... STATUS_STEPS, STATUS_COLORS, getStepIndex, and OrderCard remain exactly the same ...
const STATUS_STEPS = [
    { key: 'Pending', label: 'Order Sent', sub: 'Waiting for chef to accept', icon: Clock },
    { key: 'Accepted', label: 'Chef is Cooking', sub: 'Your meal is being prepared', icon: ChefHat },
    { key: 'Ready', label: 'Ready to Serve', sub: 'Waiter is bringing your food', icon: Package },
    { key: 'Served', label: 'Served', sub: 'Enjoy your meal!', icon: CheckCircle2 },
    { key: 'Completed', label: 'Paid & Closed', sub: 'Receipt generated. Thank you!', icon: Receipt },
];

const STATUS_COLORS = {
    Pending: { bg: 'bg-amber-500', text: 'text-amber-600' },
    Accepted: { bg: 'bg-primary', text: 'text-primary' },
    Completed: { bg: 'bg-green-600', text: 'text-green-700' },
    Rejected: { bg: 'bg-red-500', text: 'text-red-600' },
};

const getStepIndex = (status) => {
    if (['Accepted', 'Preparing'].includes(status)) return 1;
    if (status === 'Ready') return 2;
    if (status === 'Served') return 3;
    if (status === 'Completed') return 4;
    return 0;
};

const OrderCard = ({ order }) => {
    const stepIndex = getStepIndex(order.status);
    const isRejected = order.status === 'Rejected';
    const isCompleted = order.status === 'Completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden border border-on-surface/5 editorial-shadow mb-6"
        >
            <div className={`p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-4 ${isRejected ? 'bg-red-600' : isCompleted ? 'bg-green-600' : 'bg-primary'} text-white relative`}>
                <div className="relative z-10">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MapPin size={14} />
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-80">Table {order.tableNumber}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">#{order._id.slice(-6).toUpperCase()}</h2>
                </div>
                <div className="relative z-10 text-left sm:text-right">
                    <p className="text-[10px] font-black tracking-widest opacity-70 uppercase">Bill Amount</p>
                    <p className="text-3xl font-black">₹{order.totalAmount}</p>
                </div>
            </div>

            <div className="px-8 pt-6">
                <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, i) => (
                        <div key={i} className="px-4 py-2 bg-surface-container-low rounded-xl text-xs font-black text-on-surface">
                            {item.quantity}x {item.dishId?.name || 'Item'}
                        </div>
                    ))}
                </div>
            </div>

            {isRejected ? (
                <div className="m-8 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
                    <AlertCircle className="text-red-600" />
                    <div>
                        <h4 className="font-black text-red-700">Order Declined</h4>
                        <p className="text-xs text-red-500 font-bold">The kitchen cannot fulfill this order right now.</p>
                    </div>
                </div>
            ) : (
                <div className="p-8">
                    <div className="relative flex flex-col gap-8">
                        <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-surface-container-high" />
                        {STATUS_STEPS.map((step, i) => {
                            const isDone = i < stepIndex;
                            const isCurrent = i === stepIndex;
                            const Icon = step.icon;
                            return (
                                <div key={step.key} className={`relative flex gap-6 items-start ${i > stepIndex ? 'opacity-30' : 'opacity-100'}`}>
                                    <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 
                                        ${isDone ? 'bg-primary shadow-lg shadow-primary/20' : isCurrent ? 'bg-white border-4 border-primary' : 'bg-surface-container-high'}`}>
                                        {isDone ? <CheckCircle2 size={16} color="white" /> : <Icon size={14} color={isCurrent ? 'var(--primary)' : 'gray'} />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>{step.label}</h4>
                                        <p className="text-[11px] font-bold text-on-surface-variant opacity-70">{step.sub}</p>
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

const OrderTracking = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Store previous statuses to prevent duplicate alerts
    const statusCache = useRef({});

    const fetchOrders = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders/user`);
            const fetchedOrders = res.data;

            // 2. Alert Logic: Compare current status vs. cached status
            fetchedOrders.forEach(order => {
                const orderId = order._id;
                const currentStatus = order.status;
                const previousStatus = statusCache.current[orderId];

                // Only alert if status has actually CHANGED
                if (previousStatus && previousStatus !== currentStatus) {
                    if (currentStatus === 'Completed') {
                        alert(`Table ${order.tableNumber}: Your bill has been paid! Thank you.`);
                    } else if (currentStatus === 'Accepted') {
                        // Optional toast or small alert for acceptance
                        console.log("Order accepted by kitchen");
                    }
                }

                // Update the cache for the next refresh
                statusCache.current[orderId] = currentStatus;
            });

            const sorted = fetchedOrders.sort((a, b) => {
                const orderMap = { Pending: 0, Accepted: 1, Preparing: 1, Ready: 1, Served: 1, Completed: 2, Rejected: 3 };
                return (orderMap[a.status] || 0) - (orderMap[b.status] || 0);
            });
            setOrders(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);

        // 3. Named handler for proper cleanup
        const onUpdate = () => {
            fetchOrders();
        };

        socket.on('orderUpdate', onUpdate);

        return () => {
            socket.off('orderUpdate', onUpdate); // Remove specific listener
            socket.disconnect();
        };
    }, [fetchOrders]);

    const activeOrders = orders.filter(o => !['Completed', 'Rejected'].includes(o.status));
    const pastOrders = orders.filter(o => ['Completed', 'Rejected'].includes(o.status));

    return (
        <div className="min-h-screen bg-surface px-4 py-8">
            <header className="max-w-2xl mx-auto flex items-center justify-between mb-10">
                <button onClick={() => navigate('/')} className="w-12 h-12 rounded-2xl bg-surface-container-lowest border border-on-surface/5 flex items-center justify-center">
                    <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black uppercase tracking-tighter">Track Flavours</h1>
                    <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Real-time Kitchen Sync</p>
                </div>
                <button onClick={fetchOrders} className="w-12 h-12 rounded-2xl bg-surface-container-lowest border border-on-surface/5 flex items-center justify-center">
                    <RefreshCw size={18} />
                </button>
            </header>

            <main className="max-w-2xl mx-auto">
                {loading ? (
                    <div className="py-20 text-center font-black text-primary animate-pulse uppercase tracking-widest text-xs">Syncing with Kitchen...</div>
                ) : (
                    <>
                        {activeOrders.map(order => <OrderCard key={order._id} order={order} />)}
                        {pastOrders.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 opacity-40">Previous Experiences</h3>
                                {pastOrders.map(order => <OrderCard key={order._id} order={order} />)}
                            </div>
                        )}
                        {orders.length === 0 && (
                            <div className="py-20 text-center opacity-30">
                                <Package size={48} className="mx-auto mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No orders found</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default OrderTracking;