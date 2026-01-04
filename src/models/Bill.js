const mongoose = require('mongoose');

/**
 * [ABSTRACTION - ENTITY MODELING]
 * billSchema mengabstraksikan konsep "Invois" atau "Penagihan" ke dalam sistem.
 * Ini merangkum semua atribut yang diperlukan untuk mendefinisikan sebuah kewajiban 
 * finansial dari penyewa (Tenant) kepada pemilik properti.
 */
const billSchema = new mongoose.Schema({
    billId: {
        type: String,
        required: true,
        unique: true
    },
    /**
     * [ASSOCIATION - OBJECT COUPLING]
     * Model ini memiliki ketergantungan (coupling) yang kuat dengan objek 'Tenant' 
     * dan 'User' (sebagai kreator). Hal ini merepresentasikan hubungan antar-objek 
     * di mana Bill berperan sebagai jembatan informasi antara Tenant dan Admin.
     */
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant', // ← bukan 'User'
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: 'Tagihan sewa'
    },
    /**
     * [ENCAPSULATION - DOMAIN VALIDATION]
     * Penggunaan batasan 'min: 0' pada amount adalah bentuk enkapsulasi aturan 
     * domain. Kita memastikan state internal dari objek Bill tidak akan pernah 
     * berada dalam kondisi finansial yang tidak logis (negatif).
     */
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        default: null // opsional, bisa null jika langsung bayar
    },

    /**
     * [STATE TRANSITION]
     * Properti status, paymentMethod, dan paymentProof merepresentasikan 
     * transisi state dari objek. Sebuah Bill bersifat dinamis; ia bisa berubah 
     * dari 'unpaid' menjadi 'paid' melalui metode perilaku (behavior) tertentu.
     */
    status: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
       
    },

    paymentMethod: {
        type: String,
        enum: ['cash', 'transfer', 'qris'],
        default: null
    },
    paymentProof: {
        type: String, // URL gambar bukti (opsional, terutama untuk transfer/qris)
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // admin/owner yang membuat tagihan
        required: true
    }
}, {
    // Memberikan catatan waktu otomatis untuk audit trail
    timestamps: true 
});

module.exports = mongoose.model('Bill', billSchema);