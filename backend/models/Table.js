const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Busy'], default: 'Available' },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
});

tableSchema.index({ number: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
