const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    priceMonthly: { type: Number, default: 0 }, 
    priceDaily: { type: Number, default: 0 },  
    capacity: { type: Number, required: true },
    facilities: { type: [String], default: [] },
    status: { type: String, default: 'available' },
    currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);