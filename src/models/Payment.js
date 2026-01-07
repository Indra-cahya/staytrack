const mongoose = require('mongoose');

/**
 * [BLUEPRINT / SCHEMA DEFINITION]
 * paymentSchema mendefinisikan struktur dan atribut (state) yang akan dimiliki 
 * oleh setiap instance dari objek Payment.
 */
const paymentSchema = new mongoose.Schema({
    /**
     * [ASSOCIATION / RELATIONSHIP]
     * Menggunakan Referensi (ObjectId) untuk menghubungkan objek Payment 
     * dengan objek Tenant, Room, dan User (Admin).
     */
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // UNTUK DIFILTER DI LAPORAN
    rentalType: { 
        type: String, 
        enum: ['monthly', 'daily'], 
        default: 'monthly' 
    },

    /**
     * [DATA ENCAPSULATION & VALIDATION]
     * Membatasi nilai input (enum) untuk menjaga integritas data pada objek.
     */
    method: { type: String, enum: ['cash', 'transfer', 'qr'], required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
}, { 
    /**
     * [AUTOMATIC STATE TRACKING]
     */
    timestamps: true 
});

/**
 * [CLASS COMPILATION]
 * Mengompilasi Schema menjadi Model (Class) yang siap di-instansiasi.
 */
module.exports = mongoose.model('Payment', paymentSchema);