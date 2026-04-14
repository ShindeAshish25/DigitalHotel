import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    RefreshCw,
    Receipt,
    Search,
    X,
    CreditCard,
    AlertCircle,
    Printer
} from 'lucide-react';
import io from 'socket.io-client';

import { useSelector } from 'react-redux';

// Ensure Axios sends the JWT cookie for authentication
axios.defaults.withCredentials = true;

const AdminOrders = () => {
    const { user } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ pending: 0, active: 0 });
    const [receiptOrder, setReceiptOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const lastAlertedOrderId = useRef(null);

    // --- Audio Notification Logic ---
    const playNotification = (orderId) => {
        if (lastAlertedOrderId.current === orderId) return;
        lastAlertedOrderId.current = orderId;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 880;
            g.gain.value = 0.1;
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            setTimeout(() => { o.stop(); ctx.close(); }, 200);
        } catch (e) {
            console.warn("Audio blocked by browser");
        }
    };

    // --- Data Fetching Logic ---
    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/orders');
            const allOrders = res.data;

            // Filter out finished orders (Completed/Rejected)
            const active = allOrders.filter(o => !['Completed', 'Rejected'].includes(o.status));
            setOrders(active);

            setStats({
                pending: allOrders.filter(o => o.status === 'Pending').length,
                active: allOrders.filter(o => o.status === 'Accepted').length
            });
        } catch (err) {
            console.error("Orders fetch error:", err);
        }
    };

    // --- Socket & Lifecycle ---
    useEffect(() => {
        const socketURL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        const socket = io(socketURL, { transports: ['websocket', 'polling'] });

        if (user?._id) {
            socket.emit('join_admin', user._id);
        }

        fetchOrders();

        socket.on('newOrder', (data) => {
            playNotification(data?._id);
            fetchOrders();
        });

        socket.on('orderUpdate', () => fetchOrders());

        return () => {
            socket.off('newOrder');
            socket.off('orderUpdate');
            socket.disconnect();
        };
    }, [user]);

    // --- Status & Payment Actions ---
    const updateStatus = async (id, status) => {
        try {
            await axios.put(`/api/orders/${id}/status`, { status });
            fetchOrders();
        } catch (err) {
            console.error("Status update error");
        }
    };

    // STEP 1: Show the modal with the order details
    const showBillPopup = (order) => {
        setReceiptOrder(order);
    };

    const handleConfirmPayment = async () => {
        if (!receiptOrder) return;
        setLoading(true);

        try {
            // 1. Let the backend handle both closing the order and freeing the table:
            await axios.post(`/api/orders/${receiptOrder._id}/bill`);

            // 3. Cleanup
            setReceiptOrder(null);
            fetchOrders();

        } catch (err) {
            console.error("Checkout Error:", err);
            alert("Error finalizing payment.");
        } finally {
            setLoading(false);
        }
    };
    // --- Search Filter Logic ---
    const filteredOrders = orders.filter(order => {
        const idMatch = order._id.slice(-6).toLowerCase().includes(searchTerm.toLowerCase());
        const tableMatch = order.tableNumber?.toString().includes(searchTerm);
        return idMatch || tableMatch;
    });

    return (
        <main className="flex-1 px-4 md:px-10 py-8 bg-gray-50 min-h-screen font-sans">
            {/* Header & Search */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 mb-1">Order Desk</h2>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Sync Active</p>
                    </div>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search ID or Table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 focus:border-red-600 rounded-3xl py-4 pl-14 pr-12 font-bold text-sm outline-none transition-all shadow-sm"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </header>

            {/* Simple Stats Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100">
                    <span className="text-[10px] font-black uppercase text-amber-700 mb-1 block">New Requests</span>
                    <span className="text-4xl font-black text-amber-900">{stats.pending.toString().padStart(2, '0')}</span>
                </div>
                <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100">
                    <span className="text-[10px] font-black uppercase text-red-700 mb-1 block">Active Tables</span>
                    <span className="text-4xl font-black text-red-900">{stats.active.toString().padStart(2, '0')}</span>
                </div>
            </section>

            {/* Orders Feed Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-24">
                <AnimatePresence mode="popLayout">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <motion.div
                                key={order._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white rounded-[2.5rem] p-8 shadow-sm border-2 transition-all ${order.status === 'Pending' ? 'border-amber-200' : 'border-gray-100'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${order.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                                            {order.status === 'Pending' ? 'Action Required' : 'In Progress'}
                                        </span>
                                        <h3 className="text-3xl font-black text-gray-900">Table {order.tableNumber}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total</p>
                                        <p className="text-3xl font-black text-gray-900">₹{order.totalAmount}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 py-6 border-y border-gray-50">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-gray-700">
                                                <span className="text-red-600 mr-2">{item.quantity}x</span>
                                                {item.dishId?.name || 'Unknown Dish'}
                                            </p>
                                            <p className="text-sm font-bold text-gray-400">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-6">
                                    {order.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => updateStatus(order._id, 'Rejected')} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">Reject</button>
                                            <button onClick={() => updateStatus(order._id, 'Accepted')} className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-gray-200">Accept Order</button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2 w-full">
                                            {/* Advanced Status Setters for Customers */}
                                            <div className="flex gap-2">
                                                {['Accepted', 'Preparing'].includes(order.status) && <button onClick={() => updateStatus(order._id, 'Ready')} className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase bg-blue-50 text-blue-600 hover:bg-blue-100">Ready</button>}
                                                {order.status === 'Ready' && <button onClick={() => updateStatus(order._id, 'Served')} className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase bg-purple-50 text-purple-600 hover:bg-purple-100">Served</button>}
                                            </div>
                                            <button onClick={() => showBillPopup(order)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl shadow-red-100 mt-2">
                                                <Receipt size={18} /> View Bill & Checkout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <p className="font-black uppercase tracking-widest text-gray-300">No Orders in Queue</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bill & Payment Confirmation Modal */}
            <AnimatePresence>
                {receiptOrder && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
                    >
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl overflow-hidden relative">
                            {/* Modal Background Icon */}
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CreditCard size={40} />
                            </div>

                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">Final Amount</p>
                            <h3 className="text-5xl font-black text-gray-900 mb-8">₹{receiptOrder.totalAmount}</h3>

                            <div className="bg-gray-50 rounded-[2rem] p-6 mb-8 text-left space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Table Number</span>
                                    <span className="font-black text-gray-900">Table {receiptOrder.tableNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Total Items</span>
                                    <span className="font-black text-gray-900">{receiptOrder.items.length} Dishes</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <CheckCircle size={18} />
                                    {loading ? 'Processing...' : 'Confirm Paid & Close'}
                                </button>

                                <button
                                    onClick={() => setReceiptOrder(null)}
                                    disabled={loading}
                                    className="w-full py-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual Refresh Floating Button */}
            <button onClick={fetchOrders} className="fixed bottom-8 right-8 w-16 h-16 bg-white border-2 border-gray-100 rounded-full shadow-2xl flex items-center justify-center text-gray-900 hover:text-red-600 transition-all active:scale-90">
                <RefreshCw size={24} />
            </button>
        </main>
    );
};

export default AdminOrders;