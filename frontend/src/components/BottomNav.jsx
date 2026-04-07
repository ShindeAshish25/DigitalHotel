import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, ClipboardList, ShoppingBag, User } from 'lucide-react';
import { toggleCart } from '../slices/cartSlice';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { items, adminId } = useSelector((state) => state.cart);
  const isPublicMenu = location.pathname.startsWith('/menu/');

  const navItems = [
    { icon: Home, label: 'Menu', path: isPublicMenu ? location.pathname : (adminId ? `/menu/${adminId}` : '/'), action: () => navigate(isPublicMenu ? location.pathname : (adminId ? `/menu/${adminId}` : '/')) },
    { icon: ClipboardList, label: 'Orders', path: '/track-order', action: () => navigate('/track-order') },
    { icon: ShoppingBag, label: 'Cart', path: 'cart', action: () => dispatch(toggleCart()), badge: items.length },
    { icon: User, label: 'Profile', path: '/profile', action: () => navigate('/profile') },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-md">
      <nav className="glass-effect rounded-full px-6 py-3 flex justify-between items-center shadow-2xl border border-white/20">
        {navItems.map((item) => {
          const isActive = item.path !== 'cart' && (location.pathname === item.path || (item.label === 'Menu' && isPublicMenu));
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-primary' : 'text-on-surface-variant/60'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {item.badge}
                </span>
              )}
              
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
