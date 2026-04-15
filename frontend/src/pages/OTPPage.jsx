import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, requestOtp } from '../slices/authSlice'; // Import requestOtp for resending
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Utensils, ArrowRight, RotateCcw } from 'lucide-react';

const OTPPage = () => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60); // 60 seconds timer
    const [canResend, setCanResend] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const mobile = location.state?.mobile || '';
    const tempToken = location.state?.tempToken || null;
    const role = location.state?.role || 'user';
    const name = location.state?.name || '';
    const email = location.state?.email || '';
    const from = location.state?.from || (role === 'admin' ? '/admin' : '/');

    // --- Timer Logic ---
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleResend = async () => {
        if (!canResend) return;

        // Reset state
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '']);

        // Dispatch request again
        await dispatch(requestOtp({ name, mobile, email, role }));
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only allow numbers
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < otp.length - 1) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (timer === 0) return alert("OTP Expired. Please resend.");

        const fullOtp = otp.join('');
        const res = await dispatch(verifyOTP({ mobile, otp: fullOtp, tempToken, role }));
        if (res.meta.requestStatus === 'fulfilled') {
            navigate(from, { replace: true });
        } else {
            alert('Invalid verification code.');
        }
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 h-16">
                <button onClick={() => navigate('/login')} className="p-2 hover:bg-surface-container-high rounded-full transition-all">
                    <ArrowLeft size={24} color="var(--on-surface)" />
                </button>
                <h1 className="title-lg" style={{ color: 'var(--primary)', fontWeight: 800 }}>Verification</h1>
                <div style={{ width: '40px' }}></div>
            </header>

            <main style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                {/* Timer Icon Section */}
                <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'var(--primary-container)', borderRadius: '2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(184, 19, 14, 0.1)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <Utensils color="white" size={40} />
                    </div>
                    {/* Floating Timer Badge */}
                    <motion.div
                        animate={{ scale: timer < 10 ? [1, 1.1, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{
                            position: 'absolute', bottom: '-10px', right: '-10px',
                            background: timer === 0 ? 'var(--error)' : 'var(--secondary)',
                            color: 'white', padding: '4px 12px', borderRadius: '12px',
                            fontSize: '0.75rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        00:{timer.toString().padStart(2, '0')}
                    </motion.div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 className="headline-md" style={{ marginBottom: '0.75rem' }}>Verify Your Email</h2>
                    <p className="body-md" style={{ padding: '0 1rem', opacity: 0.7 }}>
                        Enter the code sent to <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{email || '+91 ' + mobile}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                type="text"
                                inputMode="numeric"
                                className="input-field"
                                style={{
                                    width: '100%', height: '5rem', textAlign: 'center',
                                    fontSize: '1.75rem', fontWeight: 800, padding: 0,
                                    border: timer === 0 ? '2px solid var(--outline-variant)' : '2px solid var(--primary)',
                                    opacity: timer === 0 ? 0.5 : 1
                                }}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                        document.getElementById(`otp-${i - 1}`).focus();
                                    }
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            type="submit"
                            disabled={timer === 0}
                            className="btn-primary"
                            style={{
                                width: '100%', padding: '1.25rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: timer === 0 ? 0.5 : 1
                            }}
                        >
                            <span>Verify & Continue</span>
                            <ArrowRight size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend}
                            className="btn-secondary"
                            style={{
                                width: '100%', padding: '1rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                background: canResend ? 'var(--surface-container-high)' : 'transparent',
                                color: canResend ? 'var(--primary)' : 'var(--on-surface-variant)',
                                border: 'none', cursor: canResend ? 'pointer' : 'default'
                            }}
                        >
                            <RotateCcw size={16} className={!canResend ? '' : 'animate-spin-slow'} />
                            <span>{canResend ? "Resend Code Now" : `Resend in ${timer}s`}</span>
                        </button>
                    </div>
                </form>
            </main>

            {/* Background Decorations */}
            <div style={{ position: 'fixed', bottom: '-6rem', left: '-6rem', width: '16rem', height: '16rem', background: 'rgba(184, 19, 14, 0.05)', borderRadius: '50%', filter: 'blur(48px)', zIndex: -1 }}></div>
            <div style={{ position: 'fixed', top: '6rem', right: '-3rem', width: '12rem', height: '12rem', background: 'rgba(140, 80, 0, 0.05)', borderRadius: '50%', filter: 'blur(32px)', zIndex: -1 }}></div>
        </div>
    );
};

export default OTPPage;