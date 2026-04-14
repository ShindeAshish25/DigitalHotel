import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlusCircle, 
    Edit3, 
    Trash2, 
    Utensils, 
    ChevronRight,
    Search,
    Image as ImageIcon,
    Plus
} from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';
import AddDishModal from './AddDishModal';

const AdminMenu = () => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isAddDishOpen, setIsAddDishOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editDish, setEditDish] = useState(null);

    const fetchData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/menu/categories`),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/menu`)
            ]);
            setCategories(catRes.data);
            setMenuItems(itemRes.data);
        } catch (err) {
            console.error("Menu fetch error:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const deleteItem = async (id) => {
        if (!window.confirm("Are you sure you want to delete this dish?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/menu/${id}`);
            fetchData();
        } catch (err) {
            console.error("Delete dish error:", err);
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category? All dishes inside it will also be deleted.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/menu/categories/${id}`);
            fetchData();
        } catch (err) {
            console.error("Delete category error:", err);
        }
    };

    return (
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full bg-surface">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface">Menu Management</h1>
                    <p className="text-on-surface-variant max-w-xl">Curate your digital lookbook. Organize dishes into elegant categories and update pricing instantly.</p>
                </div>
                <button 
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-red-900/10 active:scale-95 transition-transform"
                >
                    <PlusCircle size={20} />
                    <span>Add Category</span>
                </button>
            </div>

            {/* Menu Content */}
            <div className="space-y-16">
                {categories.map((category) => (
                    <section key={category._id}>
                        <div className="flex items-center justify-between mb-8 pb-2">
                            <div className="flex items-center gap-3">
                                <span className="w-12 h-1 bg-primary rounded-full"></span>
                                <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                                <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2 py-1 rounded-md uppercase">
                                    {menuItems.filter(i => i.category?._id === category._id).length} Items
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                                    <Edit3 size={14} /> Manage Category
                                </button>
                                <button 
                                    onClick={() => deleteCategory(category._id)}
                                    className="text-red-600 font-bold text-sm flex items-center gap-1 hover:underline"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {menuItems.filter(i => i.category?._id === category._id).map((dish) => (
                                <motion.div 
                                    key={dish._id}
                                    whileHover={{ y: -4 }}
                                    className="bg-surface-container-lowest rounded-3xl overflow-hidden flex shadow-sm hover:shadow-md transition-shadow duration-300"
                                >
                                    <div className="w-32 md:w-48 h-full bg-surface-variant shrink-0">
                                        <img 
                                            className="w-full h-full object-cover" 
                                            src={dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"} 
                                            alt={dish.name} 
                                        />
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-on-surface">{dish.name}</h3>
                                                <div className="flex flex-col items-end">
                                                    {dish.discountPercentage > 0 && (
                                                        <span className="text-[10px] font-bold text-on-surface-variant line-through opacity-50">₹{dish.originalPrice}</span>
                                                    )}
                                                    <span className="text-primary font-black text-lg">₹{dish.finalPrice}</span>
                                                </div>
                                            </div>
                                            <p className="text-on-surface-variant text-sm line-clamp-2">{dish.description}</p>
                                        </div>
                                        <div className="flex gap-4 mt-4">
                                            <button
                                                className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
                                                onClick={() => {
                                                    setEditDish(dish);
                                                    setSelectedCategory(dish.category?._id || null);
                                                    setIsAddDishOpen(true);
                                                }}
                                            >
                                                <Edit3 size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Edit</span>
                                            </button>
                                            <button 
                                                onClick={() => deleteItem(dish._id)}
                                                className="flex items-center gap-1 text-on-surface-variant hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add Dish for this category */}
                            <div 
                                onClick={() => {
                                    setSelectedCategory(category._id);
                                    setIsAddDishOpen(true);
                                }}
                                className="border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/30 transition-colors cursor-pointer group"
                            >
                                <PlusCircle className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold tracking-tight">Add New Dish to {category.name}</span>
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {/* Add Dish Global FAB */}
            <button 
                onClick={() => {
                    setSelectedCategory(null);
                    setIsAddDishOpen(true);
                }}
                className="fixed right-6 bottom-24 md:bottom-8 z-50 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-900/40 hover:scale-110 transition-transform active:scale-95"
            >
                <Plus size={32} />
            </button>

            {/* Modals */}
            <AddCategoryModal 
                isOpen={isAddCategoryOpen} 
                onClose={() => {
                    setIsAddCategoryOpen(false);
                    fetchData();
                }} 
            />
            <AddDishModal 
                isOpen={isAddDishOpen} 
                categoryId={selectedCategory}
                categories={categories}
                                dish={editDish}
                onClose={() => {
                    setIsAddDishOpen(false);
                                    setEditDish(null);
                    fetchData();
                }} 
            />
        </main>
    );
};

export default AdminMenu;
