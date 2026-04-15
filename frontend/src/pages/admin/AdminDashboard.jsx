import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    TrendingUp,
    Users,
    Armchair,
    ChevronRight,
    Search
} from 'lucide-react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        liveOrders: 0,
        revenue: 0,
        occupiedPercent: 0,
        pending: 0,
        preparing: 0,
        ready: 0
    });
    const [tables, setTables] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);

    useEffect(() => {
        const socketURL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        const socket = io(socketURL, { transports: ['websocket', 'polling'] });

        if (user?._id) {
            socket.emit('join_admin', user._id);
        }

        const fetchData = async () => {
            try {
                const [ordersRes, tablesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`),
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/tables/admin`)
                ]);

                const orders = ordersRes.data;
                const tablesData = tablesRes.data;

                const today = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
                const live = orders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status));
                const revenue = today.reduce((acc, curr) => acc + curr.totalAmount, 0);
                const occupied = tablesData.filter(t => t.status === 'Busy').length;

                setStats({
                    liveOrders: live.length,
                    revenue: revenue,
                    occupiedPercent: Math.round((occupied / tablesData.length) * 100) || 0,
                    pending: live.filter(o => o.status === 'Pending').length,
                    preparing: live.filter(o => o.status === 'Preparing').length,
                    ready: live.filter(o => o.status === 'Ready').length
                });

                setTables(tablesData);
                setActiveOrders(live.slice(0, 4)); // Show top 4 active orders
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
        };

        fetchData();
        socket.on('orderUpdate', fetchData);
        socket.on('tableUpdate', fetchData);
        socket.on('newOrder', fetchData);

        return () => {
            socket.off('orderUpdate', fetchData);
            socket.off('tableUpdate', fetchData);
            socket.off('newOrder', fetchData);
            socket.disconnect();
        };
    }, [user]);

    return (
        <main className="px-6 md:px-10 py-8 bg-surface">
            {/* Stats Overview */}
            <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary text-on-primary p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Live Orders</p>
                    <h3 className="text-5xl font-black mb-1">{stats.liveOrders}</h3>
                    <p className="text-xs opacity-90">Active in the kitchen</p>
                    <div className="mt-6 flex gap-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">{stats.preparing} Preparing</span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">{stats.ready} Ready</span>
                    </div>
                </div>

                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 group hover:bg-surface-container-high transition-colors duration-300">
                    <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Today's Revenue</p>
                    <h3 className="text-5xl font-black text-on-surface mb-1">₹{stats.revenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 text-tertiary font-bold">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Live Update</span>
                    </div>
                </div>

                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Peak Capacity</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-5xl font-black text-on-surface">{stats.occupiedPercent}%</h3>
                            <span className="text-on-surface-variant text-sm font-medium">Occupied</span>
                        </div>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-6">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.occupiedPercent}%` }}
                            className="bg-secondary h-full rounded-full"
                        ></motion.div>
                    </div>
                </div>
            </section>

            {/* Floor Plan Status */}
            <section className="mb-12">
                <div className="flex flex-col sm:flex-row items-end justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-on-surface">Floor Plan Status</h2>
                        <p className="text-on-surface-variant mt-1">Real-time monitoring of dining hall ({tables.length} Tables)</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Occupied</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {tables.map(table => (
                        <motion.div
                            key={table._id}
                            whileHover={{ y: -5 }}
                            className={`bg-surface-container-lowest p-6 rounded-3xl shadow-sm border transition-all duration-300 group cursor-pointer ${table.status === 'Busy' ? 'border-l-4 border-l-primary' : 'border-outline-variant/10'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-2xl font-black text-on-surface">{table.number.toString().padStart(2, '0')}</span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${table.status === 'Busy' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                                    {table.status === 'Busy' ? 'Busy' : 'Free'}
                                </span>
                            </div>
                            <div className="flex flex-col items-center py-4">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${table.status === 'Busy' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                                    {table.status === 'Busy' ? <Users className="w-10 h-10 fill-current" /> : <Armchair className="w-10 h-10" />}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Seats {table.capacity}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Active Order Queue Preview */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black tracking-tight text-on-surface">Active Order Queue</h2>
                    <button className="text-primary font-bold flex items-center gap-1 hover:underline">
                        View All Orders <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {activeOrders.map(order => (
                        <div key={order._id} className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20 flex gap-6">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center text-on-surface-variant">
                                {order.items[0]?.dishId?.image ? (
                                    <img src={order.items[0].dishId.image.startsWith('http') ? order.items[0].dishId.image : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''}${order.items[0].dishId.image}`} alt="Dish" className="w-full h-full object-cover" />
                                ) : (
                                    <ShoppingBag />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-lg font-bold text-on-surface">{order.items[0]?.dishId?.name || 'Multiple Items'}</h4>
                                    <span className="text-sm font-black text-primary">Table {order.tableNumber || '??'}</span>
                                </div>
                                <p className="text-sm text-on-surface-variant mb-4">{order.items.length} items total</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${order.status === 'Pending' ? 'bg-amber-100 text-amber-900' :
                                        order.status === 'Preparing' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
                                        }`}>
                                        {order.status}
                                    </span>
                                    <button className="bg-primary hover:bg-primary-container text-on-primary px-4 py-1 rounded-full text-xs font-bold transition-colors" onClick={() => navigate('/admin/orders')}>
                                        Update Status
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default AdminDashboard;
