const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    originalPrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, default: '' },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

menuSchema.virtual('finalPrice').get(function() {
    if (this.discountPercentage > 0) {
        return this.originalPrice - (this.originalPrice * this.discountPercentage / 100);
    }
    return this.originalPrice;
});

module.exports = mongoose.model('Menu', menuSchema);
