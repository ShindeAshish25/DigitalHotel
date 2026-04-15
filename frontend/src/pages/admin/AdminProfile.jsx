import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logoutUser } from '../../slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
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
    LogOut,
    QrCode,
    Download,
    ExternalLink,
    ChevronDown,
    X,
    Utensils,
    Receipt,
    RefreshCw,
    ChevronLeft,
    Printer
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
    const [qrData, setQrData] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);

    // --- STATES ---
    const [expandedDays, setExpandedDays] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showBill, setShowBill] = useState(false);

    // --- REF FOR PRINTING ---
    const receiptRef = useRef(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`);
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

    const fetchQrCode = async () => {
        setLoadingQr(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/qr`, { withCredentials: true });
            setQrData(res.data);
        } catch (err) {
            console.error('Failed to fetch QR code:', err);
        } finally {
            setLoadingQr(false);
        }
    };

    useEffect(() => {
        fetchQrCode();
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

    // --- PRINT LOGIC ---
    const handlePrint = () => {
        const printContent = receiptRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Receipt</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('</head><body className="p-10">');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // --- GROUPING BY DATE ---
    const dailyStats = historicalOrders.reduce((acc, order) => {
        const dateKey = new Date(order.createdAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        if (!acc[dateKey]) {
            acc[dateKey] = { orders: [], dailyTotal: 0 };
        }
        acc[dateKey].orders.push(order);
        acc[dateKey].dailyTotal += order.totalAmount;
        return acc;
    }, {});

    const sortedDays = Object.keys(dailyStats).sort((a, b) => new Date(b) - new Date(a));

    const toggleDay = (date) => {
        setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const closePopup = () => {
        setSelectedOrder(null);
        setShowBill(false);
    };

    return (
        <main className="flex-1 p-6 lg:p-10 max-w-full bg-surface relative">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Admin Profile</h1>
                <p className="text-on-surface-variant max-w-2xl">Manage your operational identity, review historical performance, and log internal curation notes.</p>
            </header>

            <div className="grid grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Identity & Notes */}
                <div className="col-span-12 lg:col-span-5 space-y-6 lg:space-y-8">

                    {/* Identity Bento */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-primary/10"></div>
                        <div className="relative w-32 h-32 rounded-full bg-surface-container-high overflow-hidden border-4 border-white shadow-xl mb-6 mt-8">
                            <img className="w-full h-full object-cover" src={user?.avatarUrl || "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=200"} alt="Admin Profile" />
                        </div>
                        <h2 className="text-3xl font-black text-on-surface mb-1">{user?.name || 'Administrator'}</h2>
                        <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase mb-6">
                            <Shield size={16} /> <span>System Admin</span>
                        </div>
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                                <div className="flex items-center gap-3 text-on-surface-variant"><Mail size={18} /><span className="text-sm font-medium">Email</span></div>
                                <span className="font-bold text-on-surface truncate max-w-[150px]">{user?.email || 'admin@zestful.com'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                                <div className="flex items-center gap-3 text-on-surface-variant"><Phone size={18} /><span className="text-sm font-medium">Mobile</span></div>
                                <span className="font-bold text-on-surface">+{user?.mobile || 'N/A'}</span>
                            </div>
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100">
                                <LogOut size={18} /> Sign Out of Admin
                            </button>
                        </div>
                    </motion.div>

                    {/* Insights */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20">
                        <div className="flex items-center gap-3 mb-6"><Lightbulb size={24} className="text-white opacity-80" /><h3 className="text-xl font-bold">Intelligent Insights</h3></div>
                        <ul className="space-y-4 mb-2">
                            <li className="flex items-start gap-3"><TrendingUp size={18} className="mt-1 opacity-70" /><p className="text-sm font-medium leading-relaxed opacity-90">Processed {historicalOrders.length} successful orders recently.</p></li>
                        </ul>
                    </motion.div>

                    {/* Notepad */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 flex flex-col h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-on-surface"><MessageSquare size={20} className="text-primary" /><h3 className="text-xl font-bold">My Suggestions</h3></div>
                            <button onClick={handleSaveNotes} className="text-primary hover:bg-primary/10 p-2 rounded-full relative"><Save size={20} />{savedNotice && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs px-2 py-1 rounded font-bold whitespace-nowrap">Saved!</span>}</button>
                        </div>
                        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Draft menu ideas..." className="flex-1 w-full bg-surface-container border-none rounded-2xl p-4 text-on-surface text-sm focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
                    </motion.div>

                    {/* QR Code Bento */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-on-surface"><QrCode size={20} className="text-primary" /><h3 className="text-xl font-bold">Menu QR Access</h3></div>
                            <button onClick={fetchQrCode} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors" disabled={loadingQr}>
                                <RefreshCw size={18} className={loadingQr ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loadingQr ? (
                            <div className="w-43 h-43 bg-surface-container-low animate-pulse rounded-3xl flex items-center justify-center mx-auto">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : qrData?.qrCode ? (
                            <div className="space-y-6 w-full">
                                <div className="relative group mx-auto w-43 h-43 bg-white p-3 rounded-3xl shadow-inner border border-outline-variant/20">
                                    <img src={qrData.qrCode} alt="Menu QR Code" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                                        <a href={qrData.qrCode} download={`menu-qr-${user?.name || 'admin'}.png`} className="p-3 bg-white text-primary rounded-full shadow-lg">
                                            <Download size={20} />
                                        </a>
                                    </div>
                                </div>
                                <div className="p-4 bg-surface-container-low rounded-2xl text-left overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Direct Menu URL</span>
                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                        <span className="text-xs font-bold text-on-surface truncate flex-1">{qrData.menuUrl}</span>
                                        <a href={qrData.menuUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center opacity-50">
                                <QrCode size={48} className="mx-auto mb-2" />
                                <p className="text-sm font-bold">QR code could not be loaded.</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right Column: Historical Orders */}
                <div className="col-span-12 lg:col-span-7">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div><h3 className="text-2xl font-black text-on-surface">Revenue History</h3><p className="text-sm font-medium text-on-surface-variant mt-1">Daily performance logs.</p></div>
                            <History size={24} />
                        </div>

                        {loading ? (
                            <div className="flex-1 flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
                        ) : sortedDays.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-70"><History size={48} className="mb-4" /><h4>No Data</h4></div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                                {sortedDays.map((date) => (
                                    <div key={date} className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/10">
                                        <button onClick={() => toggleDay(date)} className="w-full p-5 flex items-center justify-between hover:bg-primary/5 transition-colors">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-12 h-12 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm border border-outline-variant/20 font-black">
                                                    <span className="text-[10px] text-primary leading-none mb-1">{date.split(' ')[0]}</span>
                                                    <span className="text-lg text-on-surface leading-none">{date.split(' ')[1].replace(',', '')}</span>
                                                </div>
                                                <div><h4 className="font-extrabold text-on-surface">{date}</h4><p className="text-xs font-bold text-on-surface-variant">{dailyStats[date].orders.length} Orders</p></div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right"><span className="text-[10px] font-black uppercase text-on-surface-variant block mb-1">Revenue</span><span className="text-xl font-black text-primary">₹{dailyStats[date].dailyTotal}</span></div>
                                                <motion.div animate={{ rotate: expandedDays[date] ? 180 : 0 }}><ChevronDown size={20} className="text-on-surface-variant" /></motion.div>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedDays[date] && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 border-t border-outline-variant/10 pt-4 bg-white/40 space-y-3">
                                                    {dailyStats[date].orders.map((order) => (
                                                        <div key={order._id} onClick={() => setSelectedOrder(order)} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 hover:border-primary/30 cursor-pointer transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-black px-2 py-1 bg-surface-container-high rounded-md">T{order.tableNumber}</span>
                                                                <div className="text-left"><p className="text-sm font-bold">Order #{order._id.slice(-6).toUpperCase()}</p><p className="text-[10px] text-on-surface-variant font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                                            </div>
                                                            <div className="flex items-center gap-4"><span className="font-black">₹{order.totalAmount}</span><CheckCircle2 size={16} className="text-green-600" /></div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* --- ORDER DETAILS POPUP (MODAL) --- */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePopup} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2.5rem] shadow-2xl border border-outline-variant/20 overflow-hidden">

                            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
                                <div className="flex items-center gap-4">
                                    {showBill ? (
                                        <button onClick={() => setShowBill(false)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-colors">
                                            <ChevronLeft size={20} />
                                        </button>
                                    ) : (
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Receipt size={22} /></div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-black">{showBill ? 'Order Receipt' : 'Order Breakdown'}</h3>
                                        <p className="text-xs font-bold text-on-surface-variant">ID: #{selectedOrder._id.toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={closePopup} className="p-2 hover:bg-surface-container-high rounded-full"><X size={20} /></button>
                            </div>

                            <div className="p-8">
                                {!showBill ? (
                                    <div className="space-y-6 text-left">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-surface-container-low rounded-2xl text-left"><span className="text-[10px] font-black uppercase text-on-surface-variant block mb-1">Table</span><span className="text-lg font-black">Table {selectedOrder.tableNumber}</span></div>
                                            <div className="p-4 bg-surface-container-low rounded-2xl text-left"><span className="text-[10px] font-black uppercase text-on-surface-variant block mb-1">Status</span><span className="text-lg font-black text-green-600 flex items-center gap-2"><CheckCircle2 size={18} /> Fulfilled</span></div>
                                        </div>
                                        <div>
                                            <h4 className="flex items-center gap-2 text-sm font-black mb-4 uppercase tracking-widest text-on-surface-variant"><Utensils size={14} /> Items</h4>
                                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedOrder.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                                                        <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-xs font-bold shadow-sm">{item.quantity}x</span><span className="font-bold text-sm">{item?.dishId?.name || "Dish"}</span></div>
                                                        <span className="font-bold text-sm text-on-surface">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => setShowBill(true)} className="w-full pt-6 hover:opacity-95 transition-all">
                                            <div className="flex justify-between items-center p-4 bg-primary rounded-2xl text-white shadow-lg">
                                                <div className="text-left"><span className="font-bold uppercase tracking-widest text-[10px] opacity-80 block">Click to view</span><span className="text-2xl font-black">Final Bill</span></div>
                                                <span className="text-2xl font-black">₹{selectedOrder.totalAmount}</span>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                        {/* PRINTABLE CONTENT AREA */}
                                        <div ref={receiptRef} className="bg-white p-6 rounded-3xl border-2 border-dashed border-outline-variant/30 text-on-surface shadow-inner">
                                            <div className="text-center mb-6 border-b border-dotted pb-4">
                                                <h2 className="text-2xl font-black tracking-tighter uppercase">Digital Diner</h2>
                                                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Tax Invoice • {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="space-y-3 mb-6">
                                                {selectedOrder.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="font-medium text-on-surface-variant">{item.quantity} x {item?.dishId?.name}</span>
                                                        <span className="font-bold">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t-2 border-black border-dotted pt-4 space-y-2">
                                                <div className="flex justify-between text-xl font-black pt-2"><span>Total Pay</span><span>₹{selectedOrder.totalAmount}</span></div>
                                            </div>
                                            <div className="mt-8 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Thank you for dining!</p>
                                            </div>
                                        </div>

                                        {/* PRINT BUTTON */}
                                        <div className="mt-8 text-center">
                                            <button
                                                onClick={handlePrint}
                                                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <Printer size={20} />
                                                <span>Print or Download PDF</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default AdminProfile;