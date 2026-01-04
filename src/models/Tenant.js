const mongoose = require('mongoose');

/**
 * [ABSTRACTION]
 * tenantSchema mendefinisikan abstraksi dari entitas penyewa (Tenant). 
 * Di sini kita hanya mengambil atribut yang relevan untuk kebutuhan 
 * manajemen operasional, seperti identitas dan referensi kamar.
 */
const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, unique: true }, 
    /**
     * [ASSOCIATION - RELATIONSHIP]
     * Bagian ini menunjukkan hubungan antar objek. Dalam OOP, ini disebut 
     * 'Aggregation' atau 'Association'. Objek Tenant memiliki referensi 
     * ke objek 'Room' dan 'User'. Ini membuktikan bahwa sistem kita 
     * terdiri dari objek-objek yang saling berinteraksi.
     */
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true 
    },
    
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    /**
     * [ENCAPSULATION - STATE MANAGEMENT]
     * Field 'isActive' dan 'checkoutDate' digunakan untuk menjaga 'State' 
     * atau kondisi dari objek Tenant. Perubahan pada field ini sebaiknya 
     * dikelola melalui metode atau logika bisnis tertentu untuk menjaga 
     * konsistensi data.
     */
       isActive: { 
        type: Boolean, 
        default: true 
    },
    preferredPaymentMethod: { 
    type: String, 
    enum: ['cash', 'transfer', 'qr'] 
    },
    checkoutDate: { type: Date }
    // Mengotomatisasi pencatatan waktu pembuatan dan modifikasi objek
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);