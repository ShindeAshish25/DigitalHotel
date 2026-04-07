const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { adminAuth, auth } = require('../middleware/auth');

// Get public tables for a specific admin (QR scan)
router.get('/', async (req, res) => {
    const { adminId } = req.query;
    if (!adminId) {
        return res.status(400).json({ message: 'adminId is required for public access' });
    }
    const tables = await Table.find({ adminId });
    res.json(tables);
});

// Admin: Get their own tables securely
router.get('/admin', adminAuth, async (req, res) => {
    const tables = await Table.find({ adminId: req.user.id });
    res.json(tables);
});

// Admin: Add table
router.post('/', adminAuth, async (req, res) => {
    const table = new Table({
        ...req.body,
        adminId: req.user.id
    });
    await table.save();
    req.app.get('io')?.to(req.user.id.toString()).emit('tableUpdate');
    res.json(table);
});

// Admin: Update table
router.put('/:id', adminAuth, async (req, res) => {
    const table = await Table.findOneAndUpdate(
        { _id: req.params.id, adminId: req.user.id },
        req.body,
        { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found' });
    req.app.get('io')?.to(req.user.id.toString()).emit('tableUpdate');
    res.json(table);
});

// Admin: Delete table
router.delete('/:id', adminAuth, async (req, res) => {
    const table = await Table.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    req.app.get('io')?.to(req.user.id.toString()).emit('tableUpdate');
    res.json({ msg: 'Table deleted' });
});

module.exports = router;
