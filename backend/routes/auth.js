const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { z } = require('zod');

// --- Helper Functions ---

const generateRandomOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateTempToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
};

const sendToken = (user, statusCode, res) => {
    const token = generateToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        // Set to false in .env for local testing if not using HTTPS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    };
    res.cookie('jwt', token, cookieOptions);
    // Remove sensitive data before sending
    user.otp = undefined;
    user.otpExpires = undefined;
    res.status(statusCode).json({ user });
};

const otpRequestSchema = z.object({
    role: z.enum(['user', 'admin']).optional().default('user'),
    name: z.string().min(2, 'Name is required'),
    mobile: z.string().min(10, 'Valid mobile number is required'),
    email: z.string().email('Invalid email').optional().or(z.literal(''))
});

// --- Routes ---

/**
 * @route   POST /api/auth/request-otp
 */
router.post('/request-otp', async (req, res) => {
    try {
        const validated = otpRequestSchema.parse(req.body);
        const { role, name, mobile, email } = validated;

        if (role === 'admin' && !email) {
            return res.status(400).json({ message: 'Email is required for admin' });
        }

        const currentOtp = generateRandomOTP();

        // --- 5 MINUTE VALIDATION ---
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Changed to 5 Minutes

        const updatedUser = await User.findOneAndUpdate(
            { mobile },
            {
                otp: currentOtp,
                otpExpires: otpExpires,
                name,
                role,
                email: email || undefined
            },
            { upsert: true, returnDocument: 'after' }
        );

        // --- FLEXIBLE CLOCK LOGGING ---
        // This helper handles both 12hr and 24hr strings for clear debugging
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const timeOptions24 = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        console.log(`\n🔥 ================================================= 🔥`);
        if (role === 'admin') {
            console.log(`👨‍🍳 [ADMIN LOGIN] OTP FOR ${mobile}: ===> ${currentOtp} <===`);
        } else {
            console.log(`🍽️ [CUSTOMER LOGIN] OTP FOR ${mobile}: ===> ${currentOtp} <===`);
        }
        console.log(`🔥 ================================================= 🔥\n`);

        const tempToken = generateTempToken({ mobile });
        res.status(200).json({ message: 'OTP sent successfully (Valid for 60s)', tempToken, otp: currentOtp });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
        console.error("OTP Request Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * @route   POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
    // 1. Log what the backend actually received
    console.log("RECV BODY:", req.body);

    const { otp, tempToken } = req.body || {};

    if (!otp || !tempToken) {
        return res.status(400).json({ message: 'OTP and Session Token are required' });
    }

    try {
        // 2. Verify the temporary JWT
        const payload = jwt.verify(tempToken, process.env.JWT_SECRET);
        const mobile = payload.mobile;

        // 3. Find User
        const user = await User.findOne({ mobile });

        if (!user || !user.otp) {
            return res.status(400).json({ message: 'No active OTP request found.' });
        }

        // 4. Strict Normalization
        const inputOtp = String(otp).trim();
        const dbOtp = String(user.otp).trim();
        const isMatch = inputOtp === dbOtp;
        const isExpired = Date.now() > new Date(user.otpExpires).getTime();

        console.log(`[VERIFY] Match: ${isMatch} | Expired: ${isExpired}`);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }

        if (isExpired) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // 5. Success
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        sendToken(user, 200, res);

    } catch (err) {
        console.error("JWT/VERIFY ERROR:", err.message);
        return res.status(400).json({ message: 'Session invalid or expired' });
    }
});

/**
 * @route   POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Logged out' });
});

/**
 * @route   GET /api/auth/me
 */
router.get('/me', async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'Not logged in' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-otp -otpExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: 'Invalid session' });
    }
});

module.exports = router;