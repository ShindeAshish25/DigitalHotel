import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { clearCart } from '../slices/cartSlice';
import { ArrowLeft, Users, Check, Sparkles } from 'lucide-react';

const TableSelection = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeOrder, setActiveOrder] = useState(undefined); // undefined = still checking
    const { items } = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const total = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

    useEffect(() => {
        // 1. Check for an active (open) order first
        const checkActiveOrder = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders/active`);
                setActiveOrder(res.data.activeOrder || null);
            } catch {
                setActiveOrder(null);
            }
        };
        checkActiveOrder();

        // 2. Also fetch tables for the new-order path
        const fetchTables = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tables`);
                setTables(res.data);
            } catch (err) {
                console.error("Failed to fetch tables", err);
            }
        };
        fetchTables();
    }, []);

    // Reorder: add items to existing active order (no table selection)
    const handleReorder = async () => {
        if (!activeOrder) return;
        setLoading(true);
        try {
            await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/orders/${activeOrder._id}/add-items`, {
                items: items.map(i => ({ dishId: i._id, quantity: i.quantity, price: i.finalPrice })),
                totalAmount: total
            });
            dispatch(clearCart());
            navigate('/order-success', { state: { tableNumber: activeOrder.tableNumber, total, reorder: true } });
        } catch (err) {
            alert('Failed to add items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // New order: normal table selection flow
    const handlePlaceOrder = async () => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
                tableNumber: selectedTable.number,
                items: items.map(i => ({ dishId: i._id, quantity: i.quantity, price: i.finalPrice })),
                totalAmount: total
            });
            dispatch(clearCart());
            navigate('/order-success', { state: { tableNumber: selectedTable.number, total } });
        } catch (err) {
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface p-6 flex flex-col gap-6" style={{ position: 'relative' }}>
            <header className="flex items-center justify-between py-4">
                <button onClick={() => navigate('/')} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                    <ArrowLeft size={24} color="var(--on-surface)" />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 className="title-lg" style={{ margin: 0, fontWeight: 800 }}>{activeOrder ? 'Add to Session' : 'Table Selection'}</h1>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>Phase 02/03</span>
                </div>
                <div style={{ width: '48px' }}></div>
            </header>

            {/* Loading while checking active order */}
            {activeOrder === undefined && (
                <div className="flex flex-1 items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}

            {/* Active Session Detected: Skip table selection */}
            {activeOrder !== undefined && activeOrder !== null && (
                <main style={{ maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="editorial-shadow"
                        style={{ background: 'var(--primary)', borderRadius: '2.5rem', padding: '2.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.7, marginBottom: '1rem' }}>ACTIVE SESSION DETECTED</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem' }}>Table {activeOrder.tableNumber}</h2>
                        <p style={{ opacity: 0.85, fontSize: '0.95rem', fontWeight: 600 }}>
                            You already have an open order on this table.<br/>Your new items will be added to your current bill.
                        </p>
                        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, opacity: 0.85 }}>Existing Bill</span>
                            <span style={{ fontWeight: 900, fontSize: '1.25rem' }}>₹{activeOrder.totalAmount}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="editorial-shadow"
                        style={{ background: 'var(--surface-container-lowest)', borderRadius: '2rem', padding: '1.5rem 2rem' }}
                    >
                        <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1rem' }}>Items Being Added Now</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {items.map(item => (
                                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name || item.dishName} × {item.quantity}</span>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{(item.finalPrice * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--outline-variant)', paddingTop: '1rem' }}>
                            <span style={{ fontWeight: 800 }}>New Total Bill</span>
                            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>₹{(activeOrder.totalAmount + total).toFixed(0)}</span>
                        </div>
                    </motion.div>

                    <button
                        onClick={handleReorder}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '1.75rem', fontSize: '1rem' }}
                        disabled={loading || items.length === 0}
                    >
                        {loading ? 'Adding to Your Order...' : `Add ₹${total} to Table ${activeOrder.tableNumber}`}
                    </button>
                </main>
            )}

            {/* No Active Session: Show full table selection grid */}
            {activeOrder !== undefined && activeOrder === null && (
            <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ maxWidth: '500px' }}>
                        <h2 className="display-sm" style={{ marginBottom: '1rem' }}>A <span style={{ color: 'var(--primary)' }}>Perfect Spot</span> for Every Occasions</h2>
                        <p className="body-md">Whether it's a quiet solo breakfast or a grand family feast, choose the canvas that suits your mood.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>RESERVED</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>AVAILABLE</span>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', 
                    gap: '1.5rem' 
                }}>
                    {tables.map((table, index) => {
                        const isAvailable = table.status === 'Available';
                        const isSelected = selectedTable?._id === table._id;
                        
                        return (
                            <motion.div
                                key={table._id}
                                whileHover={isAvailable ? { y: -8, scale: 1.02 } : {}}
                                onClick={() => isAvailable && setSelectedTable(table)}
                                className="editorial-shadow"
                                style={{
                                    aspectRatio: index % 6 === 0 ? '4/5' : '1/1',
                                    gridRow: index % 6 === 0 ? 'span 2' : 'auto',
                                    background: isSelected ? 'var(--primary)' : 
                                               !isAvailable ? 'var(--primary)' : 'var(--surface-container-lowest)',
                                    borderRadius: '2rem',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '12px', 
                                        background: isAvailable && !isSelected ? 'var(--surface-container-low)' : 'rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Users size={20} color={isAvailable && !isSelected ? 'var(--on-surface-variant)' : 'white'} />
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.75rem', fontWeight: 800, 
                                        color: isAvailable && !isSelected ? 'var(--on-surface-variant)' : 'white',
                                        opacity: isSelected || !isAvailable ? 1 : 0.6
                                    }}>{table.capacity} PERS</span>
                                </div>

                                <div style={{ zIndex: 1 }}>
                                    <h3 style={{ 
                                        fontSize: '1.5rem', fontWeight: 800, margin: 0, 
                                        color: isAvailable && !isSelected ? 'var(--on-surface)' : 'white' 
                                    }}>Table {table.number}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', fontWeight: 700, 
                                            color: isAvailable && !isSelected ? '#4CAF50' : 'white',
                                        }}>
                                            {isAvailable ? 'OPEN' : 'OCCUPIED'}
                                        </span>
                                        {isAvailable && (
                                            <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></div>
                                        )}
                                        {!isAvailable && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                                        )}
                                    </div>
                                </div>

                                {isSelected && (
                                    <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: '32px', height: '32px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={20} color="var(--primary)" strokeWidth={3} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Selection Summary Footer */}
                {activeOrder === null && selectedTable && (
                    <AnimatePresence>
                        <motion.footer
                            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                            style={{ position: 'fixed', bottom: '2rem', left: '0', right: '0', maxWidth: '600px', margin: '0 auto', zIndex: 100 }}
                        >
                            <div className="editorial-shadow" style={{ background: 'var(--surface-container-lowest)', borderRadius: '2.5rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                <div style={{ flex: 1, paddingLeft: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Sparkles size={16} color="var(--primary)" />
                                        <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Table {selectedTable.number} Selected</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>Total Experience: ₹{total}</p>
                                </div>
                                <button onClick={handlePlaceOrder} className="btn-primary" style={{ padding: '1.25rem 2.5rem', borderRadius: '1.75rem', whiteSpace: 'nowrap' }} disabled={loading}>
                                    {loading ? 'Initializing...' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </motion.footer>
                    </AnimatePresence>
                )}

                <style>{`
                    .pulse { animation: pulse-animation 2s infinite; }
                    @keyframes pulse-animation {
                        0% { box-shadow: 0 0 0 0px rgba(76, 175, 80, 0.4); }
                        100% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    }
                `}</style>
            </main>
            )}
        </div>
    );
};

export default TableSelection;
