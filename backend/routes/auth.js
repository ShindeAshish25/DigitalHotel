const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const OTP_VALUE = process.env.DEV_OTP || '0000';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateTempToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });
};

const sendToken = (user, statusCode, res) => {
    const token = generateToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    };
    res.cookie('jwt', token, cookieOptions);
    res.status(statusCode).json({ user });
};

const { z } = require('zod');

const otpRequestSchema = z.object({
    role: z.enum(['user', 'admin']).optional().default('user'),
    name: z.string().min(2, 'Name is required and must be at least 2 characters'),
    mobile: z.string().min(10, 'Mobile number is required and must be valid'),
    email: z.string().email('Invalid email').optional().or(z.literal(''))
});

// Request OTP (returns a temp token for the OTP phase)
router.post('/request-otp', async (req, res) => {
    try {
        const validated = otpRequestSchema.parse(req.body);
        const { role, name, mobile, email } = validated;

        if (role === 'admin' && !email) return res.status(400).json({ message: 'Email is required for admin' });

        // Mock provider: log OTP to console. Structure kept for SMS providers (e.g., Twilio).
        console.log(`[AUTH] OTP for ${mobile} (${role}): ${OTP_VALUE}`);

        const tempToken = generateTempToken({ role, name, mobile, email });
        res.status(200).json({ message: 'OTP sent', tempToken });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { otp, tempToken, mobile: legacyMobile, role: legacyRole, name: legacyName, email: legacyEmail } = req.body || {};
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    // Allow both 0000 (required by QA) and legacy 000000 (for older UI)
    const isOtpValid = otp === OTP_VALUE || otp === '000000';
    if (!isOtpValid) return res.status(400).json({ message: 'Invalid OTP' });

    try {
        let payload = null;
        if (tempToken) {
            payload = jwt.verify(tempToken, process.env.JWT_SECRET);
        } else {
            // Backward compatibility if frontend still sends fields directly
            payload = { role: legacyRole || 'user', name: legacyName || 'New User', mobile: legacyMobile, email: legacyEmail };
        }

        if (!payload?.mobile) return res.status(400).json({ message: 'Mobile number is required' });
        if (!payload?.name) return res.status(400).json({ message: 'Name is required' });
        if (payload.role === 'admin' && !payload.email) return res.status(400).json({ message: 'Email is required for admin' });

        let user = await User.findOne({ mobile: payload.mobile });
        if (!user) {
            user = await User.create({
                mobile: payload.mobile,
                name: payload.name,
                email: payload.email,
                role: payload.role || 'user',
            });
        } else {
            // Keep profile details up-to-date on subsequent logins
            user.name = payload.name || user.name;
            if (payload.role === 'admin') user.email = payload.email || user.email;
            if (payload.role) user.role = payload.role;
            await user.save();
        }

        sendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ message: 'Verification failed' });
    }
});

router.post('/logout', (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'Not logged in' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
