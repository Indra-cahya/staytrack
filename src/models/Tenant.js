const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, unique: true }, 
    
    // TAMBAHKAN INI BIAR SISTEM TAU DIA HARIAN ATAU BULANAN
    rentalType: { 
        type: String, 
        enum: ['monthly', 'daily'], 
        default: 'monthly',
        required: true 
    },

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

    isActive: { 
        type: Boolean, 
        default: true 
    },
    preferredPaymentMethod: { 
        type: String, 
        enum: ['cash', 'transfer', 'qr'] 
    },

    // Field untuk Bulanan
    dueDate: { type: String }, 
    
    // Field untuk Harian
    checkoutDate: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);