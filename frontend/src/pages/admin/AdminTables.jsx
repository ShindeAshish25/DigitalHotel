import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Users,
    Armchair,
    LayoutGrid,
    Save,
    X,
    ChevronDown,
    MoreHorizontal
} from 'lucide-react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const AdminTables = () => {
    const { user } = useSelector(state => state.auth);
    const [tables, setTables] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [newTable, setNewTable] = useState({ number: '', capacity: 4 });
    const [editTable, setEditTable] = useState(null);

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tables/admin`);
            setTables(res.data.sort((a, b) => a.number - b.number));
        } catch (err) {
            console.error("Tables fetch error:", err);
        }
    };

    useEffect(() => {
        const socketURL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        const socket = io(socketURL, { transports: ['websocket', 'polling'] });

        if (user?._id) {
            socket.emit('join_admin', user._id);
        }

        fetchTables();

        socket.on('tableUpdate', fetchTables);

        return () => {
            socket.off('tableUpdate');
            socket.disconnect();
        };
    }, [user]);

    const addTable = async () => {
        if (!newTable.number) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/tables`, newTable);
            setIsAddOpen(false);
            setNewTable({ number: '', capacity: 4 });
            fetchTables();
        } catch (err) {
            console.error("Add table error:", err);
        }
    };

    const updateTable = async () => {
        if (!editTable?._id) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/tables/${editTable._id}`, {
                number: Number(editTable.number),
                capacity: Number(editTable.capacity),
            });
            setIsEditOpen(false);
            setEditTable(null);
            fetchTables();
        } catch (err) {
            console.error("Update table error:", err);
        }
    };

    const deleteTable = async (id) => {
        if (!window.confirm("Are you sure you want to remove this table?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/tables/${id}`);
            fetchTables();
        } catch (err) {
            console.error("Delete table error:", err);
        }
    };

    return (
        <main className="flex-1 p-6 lg:p-10 max-w-full bg-surface">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Dining Floor Topology</h2>
                    <p className="text-on-surface-variant max-w-xl">Configure your seating arrangement. Current Capacity: {tables.reduce((acc, t) => acc + t.capacity, 0)} Guests across {tables.length} Tables.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform"
                >
                    <Plus size={20} />
                    <span>Map New Table</span>
                </button>
            </header>

            {/* Tables Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {tables.map((table) => (
                    <motion.div
                        key={table._id}
                        layout
                        whileHover={{ y: -5 }}
                        className={`bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm relative group`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-3xl font-black text-on-surface tracking-tighter">
                                {table.number.toString().padStart(2, '0')}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${table.status === 'Busy' ? 'bg-primary animate-pulse' : 'bg-tertiary-container'}`}></div>
                        </div>

                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center ${table.status === 'Busy' ? 'bg-primary/5 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                {table.status === 'Busy' ? <Users size={40} /> : <Armchair size={40} />}
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Capacity</p>
                                <p className="text-lg font-bold text-on-surface">{table.capacity} Seater</p>
                            </div>
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    setEditTable({ _id: table._id, number: table.number, capacity: table.capacity });
                                    setIsEditOpen(true);
                                }}
                                className="bg-surface-container-highest p-3 rounded-full text-zinc-900 shadow-sm hover:scale-110 transition-transform"
                            >
                                <Edit3 size={20} />
                            </button>
                            <button
                                onClick={() => deleteTable(table._id)}
                                className="bg-red-50 p-3 rounded-full text-red-600 shadow-sm hover:scale-110 transition-transform"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Add Table Skeleton */}
                <div
                    onClick={() => setIsAddOpen(true)}
                    className="border-2 border-dashed border-outline-variant/30 rounded-[2rem] p-6 flex flex-col items-center justify-center text-on-surface-variant opacity-40 hover:opacity-100 hover:bg-primary/5 transition-all cursor-pointer group"
                >
                    <Plus className="w-12 h-12 mb-2 group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest text-center">Map Room</span>
                </div>
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddOpen(false)}
                            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-surface p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-3xl font-black text-on-surface mb-2">New Table</h3>
                            <p className="text-on-surface-variant mb-8">Define the floor coordinates and seating capacity.</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Table Number</label>
                                    <input
                                        type="number"
                                        className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 font-bold text-xl"
                                        placeholder="e.g. 15"
                                        value={newTable.number}
                                        onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Guest Capacity</label>
                                    <div className="flex gap-4">
                                        {[2, 4, 6, 8].map(cap => (
                                            <button
                                                key={cap}
                                                onClick={() => setNewTable({ ...newTable, capacity: cap })}
                                                className={`flex-1 py-4 rounded-xl font-bold transition-all ${newTable.capacity === cap ? 'bg-primary text-white scale-105 shadow-md' : 'bg-surface-container-high text-on-surface-variant'}`}
                                            >
                                                {cap}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button
                                        onClick={addTable}
                                        className="flex-1 bg-primary text-white py-5 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} /> Save Configuration
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Table Modal */}
            <AnimatePresence>
                {isEditOpen && editTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsEditOpen(false);
                                setEditTable(null);
                            }}
                            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-surface p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-3xl font-black text-on-surface mb-2">Edit Table</h3>
                            <p className="text-on-surface-variant mb-8">Update table number and seating capacity.</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Table Number</label>
                                    <input
                                        type="number"
                                        className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 font-bold text-xl"
                                        value={editTable.number}
                                        onChange={(e) => setEditTable({ ...editTable, number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Guest Capacity</label>
                                    <div className="flex gap-4">
                                        {[2, 4, 6, 8].map(cap => (
                                            <button
                                                key={cap}
                                                onClick={() => setEditTable({ ...editTable, capacity: cap })}
                                                className={`flex-1 py-4 rounded-xl font-bold transition-all ${Number(editTable.capacity) === cap ? 'bg-primary text-white scale-105 shadow-md' : 'bg-surface-container-high text-on-surface-variant'}`}
                                                type="button"
                                            >
                                                {cap}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button
                                        onClick={updateTable}
                                        className="flex-1 bg-primary text-white py-5 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                        type="button"
                                    >
                                        <Save size={20} /> Save Updates
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditOpen(false);
                                            setEditTable(null);
                                        }}
                                        className="px-6 py-5 rounded-full font-bold bg-surface-container-high text-on-surface-variant"
                                        type="button"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

// Helper for Edit icon
const Edit3 = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
);

export default AdminTables;
