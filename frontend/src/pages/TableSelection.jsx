import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { clearCart } from '../slices/cartSlice';
import { ArrowLeft, Users, Check, Sparkles, MapPin, ReceiptText } from 'lucide-react';

const TableSelection = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeOrder, setActiveOrder] = useState(undefined);
    const { items, adminId } = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const total = items.reduce((sum, item) => {
        const price = Number(item.finalPrice || item.originalPrice || 0);
        return sum + (price * (item.quantity || 1));
    }, 0);

    useEffect(() => {
        const checkActiveOrder = async () => {
            try {
                const url = adminId ? `${import.meta.env.VITE_API_BASE_URL}/orders/active?adminId=${adminId}` : `${import.meta.env.VITE_API_BASE_URL}/orders/active`;
                const res = await axios.get(url);
                setActiveOrder(res.data.activeOrder || null);
            } catch {
                setActiveOrder(null);
            }
        };
        checkActiveOrder();

        const fetchTables = async () => {
            try {
                const url = adminId 
                    ? `${import.meta.env.VITE_API_BASE_URL}/tables?adminId=${adminId}`
                    : `${import.meta.env.VITE_API_BASE_URL}/tables`;
                const res = await axios.get(url);
                setTables(res.data);
            } catch (err) {
                console.error("Failed to fetch tables", err);
            }
        };
        fetchTables();
    }, []);

    const handleReorder = async () => {
        if (!activeOrder) return;
        setLoading(true);
        try {
            await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/orders/${activeOrder._id}/add-items`, {
                items: items.map(i => ({ 
                    dishId: i._id, 
                    quantity: i.quantity, 
                    price: Number(i.finalPrice || i.originalPrice || 0) 
                })),
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

    const handlePlaceOrder = async () => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
                tableNumber: selectedTable.number,
                items: items.map(i => ({ 
                    dishId: i._id, 
                    quantity: i.quantity, 
                    price: Number(i.finalPrice || i.originalPrice || 0) 
                })),
                totalAmount: total,
                adminId: adminId
            });
            dispatch(clearCart());
            navigate('/order-success', { state: { tableNumber: selectedTable.number, total } });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'rgba(var(--surface-rgb), 0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <button onClick={() => navigate('/')} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={20} color="var(--on-surface)" />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {activeOrder ? 'Sync with Table' : 'Choose Your Spot'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '2px', background: 'var(--primary)' }}></div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Step 02 of 03</span>
                        <div style={{ width: '12px', height: '2px', background: 'var(--outline-variant)' }}></div>
                    </div>
                </div>
                <div style={{ width: '44px' }}></div>
            </header>

            {activeOrder === undefined && (
                <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loader-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--surface-container-high)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
                </div>
            )}

            {/* CASE 1: ACTIVE SESSION */}
            {activeOrder !== undefined && activeOrder !== null && (
                <main style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'var(--primary)', borderRadius: '2.5rem', padding: '2rem', color: 'white', overflow: 'hidden', position: 'relative' }}
                        className="editorial-shadow"
                    >
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                            <ReceiptText size={150} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 'full', width: 'fit-content', marginBottom: '1rem' }}>
                            <Sparkles size={12} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 900 }}>LIVE SESSION</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 0.5rem' }}>Table {activeOrder.tableNumber}</h2>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, lineHeight: '1.4' }}>
                            Found your open bill! We'll tuck these new items right into your current order.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'var(--surface-container-lowest)', borderRadius: '2rem', padding: '1.5rem', border: '1px solid var(--surface-container-low)' }}
                    >
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '1px' }}>New Additions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {items.map(item => (
                                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                            {item.quantity}x
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name || item.dishName}</span>
                                    </div>
                                    <span style={{ fontWeight: 800 }}>₹{((item.finalPrice || item.originalPrice) * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: 'var(--on-surface-variant)' }}>Extra to Bill</span>
                            <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)' }}>₹{total}</span>
                        </div>
                    </motion.div>

                    <button
                        onClick={handleReorder}
                        style={{
                            width: '100%', padding: '1.25rem', borderRadius: '1.5rem', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 900, cursor: 'pointer',
                            boxShadow: '0 8px 25px rgba(var(--primary-rgb), 0.3)'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Confirm & Add to Bill'}
                    </button>
                </main>
            )}

            {/* CASE 2: TABLE SELECTION */}
            {activeOrder !== undefined && activeOrder === null && (
                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.1 }}>Find your <span style={{ color: 'var(--primary)' }}>perfect</span> corner</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>AVAILABLE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>OCCUPIED</span>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '1.25rem'
                    }}>
                        {tables.map((table) => {
                            const isAvailable = table.status === 'Available';
                            const isSelected = selectedTable?._id === table._id;

                            return (
                                <motion.div
                                    key={table._id}
                                    whileTap={isAvailable ? { scale: 0.95 } : {}}
                                    onClick={() => isAvailable && setSelectedTable(table)}
                                    style={{
                                        aspectRatio: '1/1',
                                        background: isSelected ? 'var(--primary)' :
                                            !isAvailable ? 'var(--surface-container-high)' : 'var(--surface-container-lowest)',
                                        borderRadius: '2rem',
                                        padding: '1.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                                        border: isSelected ? 'none' : '1px solid var(--surface-container-low)',
                                        position: 'relative',
                                        opacity: !isAvailable ? 0.6 : 1
                                    }}
                                    className={isAvailable ? "editorial-shadow" : ""}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--surface-container-low)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Users size={18} color={isSelected ? 'white' : 'var(--on-surface-variant)'} />
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isSelected ? 'white' : 'var(--on-surface-variant)' }}>
                                            {table.capacity} SEATS
                                        </span>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: isSelected ? 'white' : 'var(--on-surface)' }}>
                                            #{table.number}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <div className={isAvailable ? "pulse" : ""} style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAvailable ? '#4CAF50' : 'var(--on-surface-variant)' }}></div>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isSelected ? 'white' : 'var(--on-surface-variant)' }}>
                                                {isAvailable ? 'READY' : 'BUSY'}
                                            </span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'white', borderRadius: '50%', padding: '4px' }}>
                                            <Check size={16} color="var(--primary)" strokeWidth={4} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {selectedTable && (
                        <AnimatePresence>
                            <motion.footer
                                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                                style={{ position: 'fixed', bottom: '1.5rem', left: '1rem', right: '1rem', zIndex: 100 }}
                            >
                                <div className="editorial-shadow" style={{
                                    background: 'var(--on-surface)',
                                    borderRadius: '2rem',
                                    padding: '1rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    color: 'var(--surface)'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Selected spot</p>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Table {selectedTable.number}</h4>
                                    </div>
                                    <button
                                        onClick={handlePlaceOrder}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '1.25rem', fontWeight: 900, cursor: 'pointer' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Wait...' : 'Set Table'}
                                    </button>
                                </div>
                            </motion.footer>
                        </AnimatePresence>
                    )}
                </main>
            )}

            <style>{`
                .loader-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .pulse { animation: pulse-animation 2s infinite; }
                @keyframes pulse-animation {
                    0% { box-shadow: 0 0 0 0px rgba(76, 175, 80, 0.4); }
                    100% { box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); }
                }
            `}</style>
        </div>
    );
};

export default TableSelection;