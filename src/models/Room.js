const mongoose = require('mongoose');

/**
 * [ABSTRACTION]
 * roomSchema merupakan abstraksi dari entitas fisik "Kamar". 
 * Kita memodelkan karakteristik penting seperti kapasitas, fasilitas, 
 * dan harga ke dalam bentuk atribut digital.
 */
const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true, 
        trim: true
    },
    /**
     * [ENCAPSULATION - DOMAIN CONSTRAINTS]
     * Penggunaan 'enum' dan 'min' di bawah ini adalah bentuk Enkapsulasi 
     * aturan bisnis (business rules). Model bertanggung jawab memastikan 
     * bahwa objek Kamar tidak akan pernah memiliki harga negatif atau 
     * tipe yang tidak terdaftar.
     */
    type: {
        type: String,
        enum: ['standard', 'premium', 'vip'],
        default: 'standard'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    capacity: {
        type: Number,
        default: 1,
        min: 1
    },
    facilities: {
        type: [String],
        default: []
    },
    /**
     * [STATE MANAGEMENT]
     * Properti 'status' merepresentasikan state dari sebuah objek. 
     * Dalam konsep OOP, perilaku (behavior) objek seringkali bergantung 
     * pada statusnya (misal: kamar 'maintenance' tidak bisa disewa).
     */
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    /**
     * [ASSOCIATION - BIDIRECTIONAL RELATIONSHIP]
     * Ini menunjukkan hubungan asosiasi dengan model 'Tenant'. 
     * Adanya 'currentTenant' memudahkan navigasi antar-objek secara 
     * dua arah (Bidirectional) dalam logika aplikasi kita.
     */
    currentTenant: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tenant', 
        default: null
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Room', roomSchema);