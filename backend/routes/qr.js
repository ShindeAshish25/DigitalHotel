const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { adminAuth } = require('../middleware/auth');

// GET /api/qr - Generate QR code for the logged-in admin
router.get('/', adminAuth, async (req, res) => {
    try {
        const adminId = req.user._id;
        // In local dev, use the IP address if you want to scan with a physical phone
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const menuUrl = `${frontendUrl}/menu/${adminId}`;

        // Generate a high-quality QR code
        const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
            margin: 2,
            width: 500,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        res.json({
            qrCode: qrCodeDataUrl,
            menuUrl,
            adminId: adminId
        });
    } catch (err) {
        console.error('QR code generation failed:', err);
        res.status(500).json({ message: 'Failed to generate QR code' });
    }
});

module.exports = router;
