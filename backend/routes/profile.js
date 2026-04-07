const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Upload Profile Image
router.post('/upload', auth, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const user = await User.findByIdAndUpdate(req.user.id, {
        avatarUrl: `/uploads/${req.file.filename}`
    }, { new: true });

    res.json(user);
});

// Update Profile Info
router.put('/update', auth, async (req, res) => {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true });
    res.json(user);
});

module.exports = router;
