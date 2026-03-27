import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logoutUser } from '../../slices/authSlice';
import { motion } from 'framer-motion';
import { 
    User, 
    Mail, 
    Phone, 
    Shield, 
    History, 
    Lightbulb, 
    MessageSquare,
    TrendingUp,
    CheckCircle2,
    Calendar,
    Save,
    LogOut
} from 'lucide-react';

const AdminProfile = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [historicalOrders, setHistoricalOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState(() => {
        return localStorage.getItem('adminProfileNotes') || '';
    });
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`);
                // Filter only completed orders for historical view
                const completed = res.data.filter(o => o.status === 'Completed');
                setHistoricalOrders(completed);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleSaveNotes = () => {
        localStorage.setItem('adminProfileNotes', adminNotes);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/admin/login');
    };

    return (
        <main className="flex-1 p-6 lg:p-10 max-w-full bg-surface">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Admin Profile</h1>
                <p className="text-on-surface-variant max-w-2xl">Manage your operational identity, review historical performance, and log internal curation notes.</p>
            </header>

            <div className="grid grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Identity & Notes (5 cols) */}
                <div className="col-span-12 lg:col-span-5 space-y-6 lg:space-y-8">
                    
                    {/* Identity Bento */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-32 bg-primary/10"></div>
                        
                        <div className="relative w-32 h-32 rounded-full bg-surface-container-high overflow-hidden border-4 border-white shadow-xl mb-6 mt-8">
                            <img className="w-full h-full object-cover" src={user?.avatarUrl || "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=200"} alt="Admin Profile" />
                        </div>
                        
                        <h2 className="text-3xl font-black text-on-surface mb-1">{user?.name || 'Administrator'}</h2>
                        <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase mb-6">
                            <Shield size={16} />
                            <span>System Admin</span>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                                <div className="flex items-center gap-3 text-on-surface-variant">
                                    <Mail size={18} />
                                    <span className="text-sm font-medium">Email</span>
                                </div>
                                <span className="font-bold text-on-surface truncate max-w-[150px]">{user?.email || 'admin@zestful.com'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                                <div className="flex items-center gap-3 text-on-surface-variant">
                                    <Phone size={18} />
                                    <span className="text-sm font-medium">Mobile</span>
                                </div>
                                <span className="font-bold text-on-surface">+{user?.mobile || 'N/A'}</span>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100 hover:border-transparent"
                            >
                                <LogOut size={18} />
                                Sign Out of Admin
                            </button>
                        </div>
                    </motion.div>

                    {/* Operational Insights Bento */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Lightbulb size={24} className="text-white opacity-80" />
                            <h3 className="text-xl font-bold">Intelligent Insights</h3>
                        </div>
                        <ul className="space-y-4 mb-2">
                            <li className="flex items-start gap-3">
                                <TrendingUp size={18} className="mt-1 opacity-70" />
                                <p className="text-sm font-medium leading-relaxed opacity-90">Your restaurant processed {historicalOrders.length} successful orders recently. Consider optimizing staff allocation during peak evening hours.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="mt-1 opacity-70" />
                                <p className="text-sm font-medium leading-relaxed opacity-90">Table turnover rate is excellent. Keep monitoring Live Orders for potential bottlenecks.</p>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Admin Suggestions / Notepad Bento */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 flex flex-col h-[300px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-on-surface">
                                <MessageSquare size={20} className="text-primary" />
                                <h3 className="text-xl font-bold">My Suggestions & Notes</h3>
                            </div>
                            <button 
                                onClick={handleSaveNotes}
                                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors relative"
                                title="Save Notes"
                            >
                                <Save size={20} />
                                {savedNotice && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs px-2 py-1 rounded font-bold whitespace-nowrap">Saved!</span>
                                )}
                            </button>
                        </div>
                        <textarea 
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Draft menu ideas, operational suggestions, or internal notes here. These are saved exclusively to your local profile..."
                            className="flex-1 w-full bg-surface-container border-none rounded-2xl p-4 text-on-surface text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                        ></textarea>
                    </motion.div>
                </div>

                {/* Right Column: Historical Orders (7 cols) */}
                <div className="col-span-12 lg:col-span-7">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm h-full flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-on-surface">Historical Orders</h3>
                                <p className="text-sm font-medium text-on-surface-variant mt-1">A complete log of all fulfilled transactions.</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                                <History size={24} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="font-bold text-on-surface-variant">Loading archives...</p>
                            </div>
                        ) : historicalOrders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-70">
                                <History size={48} className="mb-4 text-outline" />
                                <h4 className="text-lg font-bold text-on-surface mb-2">No Historical Data</h4>
                                <p className="text-sm text-on-surface-variant max-w-sm">Completed orders will appear here for your review and auditing.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                                <div className="space-y-4">
                                    {historicalOrders.map((order) => {
                                        const d = new Date(order.createdAt);
                                        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                                        
                                        return (
                                            <div key={order._id} className="bg-surface-container-low p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow group">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary font-bold shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                                        T{order.tableNumber}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-on-surface text-base">Order #{order._id.slice(-6).toUpperCase()}</h4>
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mt-1">
                                                            <Calendar size={12} />
                                                            <span>{dateStr} • {timeStr}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                                                    <div className="text-left md:text-right">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Total Value</span>
                                                        <span className="text-lg font-black text-primary">₹{order.totalAmount}</span>
                                                    </div>
                                                    <span className="px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] text-xs font-bold rounded-full border border-[#4CAF50]/20 whitespace-nowrap">
                                                        Completed
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </main>
    );
};

export default AdminProfile;
