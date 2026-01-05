const mongoose = require('mongoose');

/**
 * [ABSTRACTION]
 * roomSchema merupakan abstraksi dari entitas fisik "Kamar". 
 * Kita memodelkan karakteristik penting seperti kapasitas, fasilitas, 
 * dan harga ke dalam bentuk atribut digital.
 */
const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    price: { type: Number, required: true }, // Biar aman buat sistem lama
    priceMonthly: { type: Number, default: 0 }, // TAMBAH INI
    priceDaily: { type: Number, default: 0 },   // TAMBAH INI
    capacity: { type: Number, required: true },
    facilities: { type: [String], default: [] }, // Pastiin ini Array biar kebaca
    status: { type: String, default: 'available' },
    currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);