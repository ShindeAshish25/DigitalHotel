const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// Place order
router.post('/', auth, async (req, res) => {
    try {
        const { tableNumber, items, totalAmount } = req.body;

        const table = await Table.findOne({ number: tableNumber });
        if (!table) return res.status(400).json({ message: 'Invalid table selected' });
        if (table.status !== 'Available') return res.status(409).json({ message: 'Table is not available' });
        
        const order = new Order({
            userId: req.user._id,
            tableNumber,
            items,
            totalAmount
        });

        await order.save();

        // Update user history
        await User.findByIdAndUpdate(req.user._id, { $push: { orderHistory: order._id } });

        // Emit socket event for admin path
        const io = req.app.get('io');
        if (io) {
            io.emit('newOrder', order);
            io.emit('orderUpdate');
        }

        res.json(order);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ message: 'Order submission failed' });
    }
});

// Admin: Get all orders
router.get('/', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId').populate('items.dishId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// User: Check for active (non-completed/non-rejected) order
router.get('/active', auth, async (req, res) => {
    try {
        const activeOrder = await Order.findOne({
            userId: req.user._id,
            status: { $nin: ['Completed', 'Rejected'] }
        }).populate('items.dishId').sort({ createdAt: -1 });
        
        res.json({ activeOrder: activeOrder || null });
    } catch (err) {
        res.status(500).json({ message: 'Failed to check active order' });
    }
});

// User: Add more items to existing active order
router.patch('/:id/add-items', auth, async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (['Completed', 'Rejected'].includes(order.status)) {
            return res.status(400).json({ message: 'Cannot add items to a completed order' });
        }

        // Merge items: if dishId already exists, increase quantity; otherwise push new
        items.forEach(newItem => {
            const existing = order.items.find(i => i.dishId?.toString() === newItem.dishId);
            if (existing) {
                existing.quantity += newItem.quantity;
            } else {
                order.items.push(newItem);
            }
        });
        order.totalAmount = (order.totalAmount || 0) + totalAmount;
        await order.save();

        // Notify admin of updated order
        const io = req.app.get('io');
        if (io) io.emit('orderUpdate', order);

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add items' });
    }
});

// User: Get history
router.get('/user', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).populate('items.dishId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

// Admin: Update status & Table Lifecycle
router.put('/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate('userId')
            .populate('items.dishId');
        
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Table Lifecycle Logic
        if (status === 'Accepted') {
            await Table.findOneAndUpdate(
                { number: order.tableNumber }, 
                { status: 'Busy', currentOrderId: order._id }
            );
            req.app.get('io')?.emit('tableUpdate');
        }

        req.app.get('io')?.emit('orderUpdate', order);
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Status update failed' });
    }
});

// Admin: Billing & Table Release
router.post('/:id/bill', adminAuth, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: 'Completed' }, { new: true })
            .populate('userId')
            .populate('items.dishId');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Release Table
        await Table.findOneAndUpdate(
            { number: order.tableNumber }, 
            { status: 'Available', currentOrderId: null }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('orderUpdate', order);
            io.emit('tableUpdate');
        }

        res.json({ message: 'Bill generated, table released', order });
    } catch (err) {
        res.status(500).json({ message: 'Billing failed' });
    }
});

module.exports = router;
