const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const Menu = require('../models/Menu');
const { adminAuth } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `menu-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// Categories
router.get('/categories', adminAuth, async (req, res) => {
    const categories = await Category.find({ adminId: req.user.id });
    res.json(categories);
});

// GET Public Menu for specific Admin
router.get('/public/:adminId', async (req, res) => {
    const { adminId } = req.params;
    try {
        const categories = await Category.find({ adminId });
        const menu = await Menu.find({ adminId }).populate('category');
        res.json({ categories, menu });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching menu' });
    }
});

router.post('/categories', adminAuth, upload.single('image'), async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const category = new Category({
            name,
            description: description || '',
            image: req.file ? `/uploads/${req.file.filename}` : '',
            adminId: req.user.id,
        });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        console.error('Error adding category:', err);
        next(err);
    }
});

router.put('/categories/:id', adminAuth, upload.single('image'), async (req, res, next) => {
    try {
        const update = { ...req.body };
        if (req.file) update.image = `/uploads/${req.file.filename}`;

        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, adminId: req.user.id },
            update,
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (err) {
        console.error('Error updating category:', err);
        next(err);
    }
});

router.delete('/categories/:id', adminAuth, async (req, res) => {
    const category = await Category.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ msg: 'Category deleted' });
});

// Menu
router.get('/', adminAuth, async (req, res) => {
    const menu = await Menu.find({ adminId: req.user.id }).populate('category');
    res.json(menu);
});

router.post('/', adminAuth, upload.single('image'), async (req, res, next) => {
    try {
        const {
            name,
            description,
            originalPrice,
            discountPercentage,
            category,
            isVeg,
            isAvailable,
        } = req.body;

        if (!name || !originalPrice || !category) {
            return res.status(400).json({ message: 'Missing required fields: name, price, or category' });
        }

        const parsedPrice = Number(originalPrice);
        const parsedDiscount = Number(discountPercentage || 0);

        if (isNaN(parsedPrice)) {
            return res.status(400).json({ message: 'Original price must be a valid number' });
        }

        const item = new Menu({
            name,
            description: description || '',
            originalPrice: parsedPrice,
            discountPercentage: isNaN(parsedDiscount) ? 0 : parsedDiscount,
            category,
            image: req.file ? `/uploads/${req.file.filename}` : '',
            isVeg: isVeg === 'true' || isVeg === true,
            isAvailable: isAvailable === 'false' || isAvailable === false ? false : true,
            adminId: req.user.id,
        });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        console.error('Error adding menu item:', err);
        next(err);
    }
});

router.put('/:id', adminAuth, upload.single('image'), async (req, res, next) => {
    try {
        const update = { ...req.body };
        if (update.originalPrice != null) {
            update.originalPrice = Number(update.originalPrice);
            if (isNaN(update.originalPrice)) delete update.originalPrice;
        }
        if (update.discountPercentage != null) {
            update.discountPercentage = Number(update.discountPercentage);
            if (isNaN(update.discountPercentage)) delete update.discountPercentage;
        }
        if (req.file) update.image = `/uploads/${req.file.filename}`;
        if (update.isVeg != null) update.isVeg = update.isVeg === 'true' || update.isVeg === true;
        if (update.isAvailable != null) update.isAvailable = !(update.isAvailable === 'false' || update.isAvailable === false);

        const item = await Menu.findOneAndUpdate(
            { _id: req.params.id, adminId: req.user.id },
            update,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ message: 'Menu item not found' });
        res.json(item);
    } catch (err) {
        console.error('Error updating menu item:', err);
        next(err);
    }
});

router.delete('/:id', adminAuth, async (req, res) => {
    const item = await Menu.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ msg: 'Item deleted' });
});

module.exports = router;
