import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    TableProperties, 
    Receipt, 
    BookOpen,
    Settings,
    Bell,
    ChefHat,
    User
} from 'lucide-react';

const AdminSidebar = () => {
    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
        { name: 'Table Status', icon: <TableProperties size={20} />, path: '/admin/tables' },
        { name: 'Live Orders', icon: <Receipt size={20} />, path: '/admin/orders' },
        { name: 'Menu Management', icon: <BookOpen size={20} />, path: '/admin/menu' },
        { name: 'Admin Profile', icon: <User size={20} />, path: '/admin/profile' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-zinc-50 dark:bg-zinc-900 flex-col gap-y-2 py-6 pt-24 z-40 border-r border-zinc-200 dark:border-zinc-800">
                <div className="px-6 mb-4">
                    <h2 className="text-lg font-bold text-red-700">Kitchen Ops</h2>
                </div>
                <nav className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                                ${isActive 
                                    ? 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 shadow-sm' 
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                            `}
                        >
                            {item.icon}
                            <span className="text-sm font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Mobile Bottom Bar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:hidden rounded-t-3xl">
                {navItems.slice(0, 4).map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center px-5 py-2 transition-all duration-300
                            ${isActive 
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl scale-105 shadow-sm' 
                                : 'text-zinc-400 dark:text-zinc-600'}
                        `}
                    >
                        {item.icon}
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.name.split(' ')[0]}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    );
};

export default AdminSidebar;
