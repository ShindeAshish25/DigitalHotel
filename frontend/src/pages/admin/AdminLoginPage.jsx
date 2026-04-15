import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, HelpCircle, Mail, User } from 'lucide-react';
import { requestOtp } from '../../slices/authSlice';

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await dispatch(requestOtp({ ...formData, role: 'admin' }));
            if (res.meta.requestStatus === 'fulfilled') {
                console.log('✅ Admin OTP Verification Code:', res.payload.otp);
                navigate('/admin/verify-otp', { state: { mobile: formData.mobile, email: formData.email, tempToken: res.payload.tempToken, role: 'admin' } });
            } else {
                setError('Failed to send OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm shadow-red-900/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-700">restaurant_menu</span>
                    <span className="text-xl font-black text-red-700 uppercase tracking-tighter">The Culinary Curator Admin</span>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <span className="text-sm font-medium text-zinc-500">Staff Portal v2.4</span>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-12">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-2xl shadow-zinc-200">
                    {/* Branding Side */}
                    <div className="relative hidden lg:block overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 mix-blend-multiply z-10"></div>
                        <img
                            className="absolute inset-0 w-full h-full object-cover"
                            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000"
                            alt="Professional Kitchen"
                        />
                        <div className="relative z-20 h-full flex flex-col justify-end p-12 text-white">
                            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Precision in every plate.</h2>
                                <p className="text-white/80 text-lg">Manage orders, update menus, and oversee the dining floor with the central curator dashboard.</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="mb-10">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                                Secure Access
                            </span>
                            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Staff Portal</h1>
                            <p className="text-on-surface-variant">Enter your credentials to access the administrative dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-zinc-400"
                                        placeholder="e.g. Julian Escoffier"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-zinc-400"
                                        placeholder="staff@culinarycurator.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Mobile Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-zinc-400"
                                        placeholder="555-0123"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-600 text-sm font-bold text-center">{error}</p>}

                            <div className="pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-5 rounded-full shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                                    type="submit"
                                >
                                    <span>Send OTP</span>
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </motion.button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
                                <button className="text-sm font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1">
                                    <HelpCircle className="w-4 h-4" />
                                    Trouble logging in?
                                </button>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Authorized Personnel Only
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <footer className="lg:hidden p-6 text-center space-y-4">
                <p className="text-xs text-on-surface-variant px-12">
                    By proceeding, you agree to the <span className="underline cursor-pointer">Security Protocols</span> and <span className="underline cursor-pointer">Data Privacy Policy</span> for internal staff members.
                </p>
            </footer>
        </div>
    );
};

export default AdminLoginPage;
