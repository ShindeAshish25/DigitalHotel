import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { verifyOTP, clearAuthError } from '../../slices/authSlice';

const AdminOTPPage = () => {
    const [otp, setOtp] = useState(['', '', '', '']); // Strictly 4 digits
    const [localError, setLocalError] = useState('');
    const inputRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Get backend error and tempToken from Redux state
    const { error: backendError, tempToken: reduxTempToken, loading } = useSelector((state) => state.auth);

    const mobile = location.state?.mobile || '';
    const email = location.state?.email || '';
    // Priority: 1. Navigation State, 2. Redux State
    const tempToken = location.state?.tempToken || reduxTempToken;

    useEffect(() => {
        // Clear any previous errors on mount
        dispatch(clearAuthError());
        setLocalError('');

        // Auto-focus the first input box
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [dispatch]);

    const handleChange = (index, value) => {
        // Only allow numeric input
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        // Take only the last character entered
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move focus back on Backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');

        // Debug: Check what we are about to send
        console.log("DEBUG SENDING:", { otp: otpString, tempToken: tempToken });

        if (otpString.length !== 4) {
            setLocalError('Enter 4 digits');
            return;
        }

        if (!tempToken) {
            setLocalError('Session expired. Please request a new OTP.');
            return;
        }

        const res = await dispatch(verifyOTP({
            otp: otpString,
            tempToken: tempToken
        }));

        if (res.meta.requestStatus === 'fulfilled') {
            navigate('/admin/dashboard');
        }
    };
    const displayError = localError || backendError;

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface antialiased flex flex-col">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 h-16 border-b border-stone-100">
                <button
                    onClick={() => navigate('/admin/login')}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-stone-100 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-900" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2">
                    <h1 className="font-bold tracking-tight text-red-700 uppercase text-xs">Admin Security</h1>
                </div>
            </header>

            <main className="flex-1 pt-24 pb-12 px-6 flex flex-col max-w-md mx-auto w-full">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-primary-container rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/10">
                        <UtensilsCrossed className="text-on-primary-container w-10 h-10" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-3">Verification Code</h2>
                    <p className="text-on-surface-variant leading-relaxed px-4 text-sm">
                        Sent to <span className="font-bold text-on-surface">{email || mobile || "Administrator"}</span>
                    </p>
                </div>

                {/* OTP Input Group */}
                <div className="flex justify-center gap-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-14 h-20 text-center text-3xl font-bold bg-stone-100 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-on-surface outline-none"
                        />
                    ))}
                </div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                    {displayError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center gap-2 text-red-600 text-sm font-bold mb-8 bg-red-50 p-4 rounded-2xl border border-red-100"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {displayError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Resend Logic placeholder */}
                <div className="text-center mb-10">
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="text-primary text-sm font-semibold hover:underline"
                    >
                        Change number or try again
                    </button>
                </div>

                {/* Actions */}
                <div className="mt-auto">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVerify}
                        disabled={loading}
                        className={`w-full h-14 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${loading
                            ? 'bg-stone-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary to-red-600 text-white shadow-primary/20'
                            }`}
                    >
                        {loading ? "Verifying..." : "Verify Identity"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </motion.button>
                </div>
            </main>

            {/* Subtle background elements */}
            <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        </div>
    );
};

export default AdminOTPPage;