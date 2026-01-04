const mongoose = require('mongoose');

/**
 * [ABSTRACTION - TRANSACTIONAL MODEL]
 * paymentSchema mengabstraksikan peristiwa transaksi keuangan ke dalam objek digital.
 * Model ini tidak hanya menyimpan data nominal, tetapi juga konteks (siapa, untuk apa, dan diproses siapa).
 */
const paymentSchema = new mongoose.Schema({
    /**
     * [COMPOSITION / AGGREGATION]
     * Objek Payment merupakan bentuk 'Composition' dari beberapa entitas lain.
     * Tanpa adanya Tenant dan Room, objek Payment ini tidak memiliki makna fungsional 
     * dalam domain sistem ini.
     */
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /**
     * [ENCAPSULATION - DATA VALIDATION]
     * Enkapsulasi di sini memastikan integritas data transaksi.
     * Penggunaan 'enum' membatasi metode pembayaran dan status agar sesuai 
     * dengan aturan domain sistem (Domain Constraints).
     */
    method: { 
        type: String, 
        enum: ['cash', 'transfer', 'qr'], 
        required: true 
    },
    amount: { type: Number, required: true },
    note: { type: String },
    /**
     * [STATE PERSISTENCE]
     * Status transaksi mewakili siklus hidup (lifecycle) dari objek Payment.
     * Ini krusial untuk audit trail dan pelaporan keuangan.
     */
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'completed' 
    }
    // Timestamps memberikan rekaman kronologis otomatis (Immutability aspect)
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);