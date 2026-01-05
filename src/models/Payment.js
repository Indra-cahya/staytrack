const mongoose = require('mongoose');

/**
 * [ABSTRACTION - TRANSACTIONAL MODEL]
 * paymentSchema mengabstraksikan peristiwa transaksi keuangan ke dalam objek digital.
 * Model ini tidak hanya menyimpan data nominal, tetapi juga konteks (siapa, untuk apa, dan diproses siapa).
 */
const paymentSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // TAMBAHKAN INI BIAR BISA DIFILTER DI LAPORAN
    rentalType: { 
        type: String, 
        enum: ['monthly', 'daily'], 
        default: 'monthly' 
    },

    method: { type: String, enum: ['cash', 'transfer', 'qr'], required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
}, { timestamps: true });
module.exports = mongoose.model('Payment', paymentSchema);