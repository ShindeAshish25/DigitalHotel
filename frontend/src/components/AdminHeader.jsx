import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';

const AdminHeader = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm shadow-red-900/5 flex items-center justify-between px-6 py-4 max-w-full">
            <div className="flex items-center gap-3">
                <Utensils className="text-red-700 dark:text-red-500 w-6 h-6" />
                <h1 className="text-xl font-black text-red-700 dark:text-red-500 uppercase tracking-tighter">The Culinary Curator Admin</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex gap-6 mr-6">
                    <span className="text-red-700 dark:text-red-400 font-semibold cursor-default">Staff Portal</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium px-2 py-1 rounded-lg">v2.4</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-on-surface">{user?.name || 'Admin Staff'}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Kitchen Curator</p>
                    </div>
                    <div onClick={() => navigate('/admin/profile')} className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden active:scale-95 transition-transform cursor-pointer border-2 border-primary/10">
                        <img 
                            className="w-full h-full object-cover" 
                            src={user?.avatar || "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=100"} 
                            alt="Admin Profile"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
