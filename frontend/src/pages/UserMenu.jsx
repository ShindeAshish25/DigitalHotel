import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { fetchPublicMenu } from '../slices/menuSlice';
import { addToCart, setAdminId } from '../slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Leaf, Flame, Sparkles, MapPin } from 'lucide-react';

const UserMenu = () => {
    const { adminId: urlAdminId } = useParams();
    const dispatch = useDispatch();
    const location = useLocation();
    const { isAuthenticated } = useSelector(state => state.auth);
    const { dishes, categories, loading } = useSelector(state => state.menu);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    const resolveImage = (src) => {
        if (!src) return '';
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        return `${baseUrl}${src}`;
    };

    useEffect(() => {
        if (urlAdminId) {
            dispatch(setAdminId(urlAdminId));
            dispatch(fetchPublicMenu(urlAdminId));
        }
    }, [dispatch, urlAdminId]);

    const filteredDishes = dishes.filter(dish => {
        const matchesCategory = selectedCategory === 'All' || dish?.category?.name === selectedCategory;
        const matchesSearch = dish?.name?.toLowerCase().includes(searchQuery?.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categoriesList = ['All', ...categories.map(c => c.name)];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-surface">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* Header Section */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '6px 14px', borderRadius: 'var(--radius-full)', width: 'fit-content', marginBottom: '0.5rem' }}>
                            <MapPin size={14} color="var(--primary)" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.5px' }}>SCAN & ORDER • WELCOME</span>
                        </div>
                        <h1 className="display-lg" style={{ margin: 0 }}>Discover <span style={{ color: 'var(--primary)' }}>Specialties</span></h1>
                    </div>
                    <div className="editorial-shadow" style={{ width: '50px', height: '50px', borderRadius: '1.25rem', background: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={22} color="var(--primary)" />
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Search our menu..."
                        style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem', background: 'var(--surface-container-lowest)', border: 'none', borderRadius: '1.5rem', fontSize: '1rem', outline: 'none' }}
                        className="editorial-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {/* Category Discovery */}
            <section>
                <h2 className="title-lg" style={{ marginBottom: '1.25rem', fontSize: '1.5rem' }}>Categories</h2>
                <div className="no-scrollbar" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '5px' }}>
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '10px 24px', borderRadius: '1.25rem', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer',
                                background: selectedCategory === cat ? 'var(--primary)' : 'var(--surface-container-low)',
                                color: selectedCategory === cat ? 'white' : 'var(--on-surface-variant)',
                                transition: '0.3s'
                            }}
                        >{cat}</button>
                    ))}
                </div>
            </section>

            {/* Dishes Grid */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 className="title-lg" style={{ fontSize: '1.5rem' }}>Available Dishes</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', paddingBottom: '100px' }}>
                    <AnimatePresence mode='popLayout'>
                        {filteredDishes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Search size={48} className="mb-4" />
                                <p className="font-bold">No dishes found in this category.</p>
                            </div>
                        ) : (
                            filteredDishes.map((dish, index) => (
                                <motion.div
                                    key={dish._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        background: 'var(--surface-container-lowest)',
                                        borderRadius: '2rem',
                                        overflow: 'hidden',
                                        minHeight: '180px',
                                        border: '1px solid var(--surface-container-low)',
                                    }}
                                    className="editorial-shadow"
                                >
                                    {/* Image */}
                                    <div style={{ position: 'relative', width: '35%', minWidth: '140px', overflow: 'hidden' }}>
                                        <img
                                            src={resolveImage(dish.image)}
                                            alt={dish.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '0.75rem', backdropFilter: 'blur(4px)' }}>
                                            {dish.isVeg ? <Leaf size={14} color="#4CAF50" fill="#4CAF50" /> : <Flame size={14} color="#FF5722" fill="#FF5722" />}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--on-surface)' }}>{dish.name}</h3>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>{dish.category?.name}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {dish.discountPercentage > 0 && (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--on-surface-variant)', textDecoration: 'line-through', opacity: 0.5 }}>₹{dish.originalPrice}</span>
                                                )}
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₹{dish.finalPrice}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => dispatch(addToCart(dish))}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '1rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                                                }}
                                            >
                                                <Plus size={18} />
                                                <span>ADD</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
};

export default UserMenu;
