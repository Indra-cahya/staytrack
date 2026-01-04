const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * [ABSTRACTION]
 * userSchema merupakan representasi abstrak dari entitas Pengguna. 
 * Kita melakukan abstraksi dengan memodelkan atribut-atribut esensial 
 * tanpa harus mengekspos kompleksitas penyimpanan data di tingkat database.
 */
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ['owner', 'admin'],
        required: true
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true

});

/**
 * [ENCAPSULATION]
 * Penggunaan Middleware 'pre-save' ini adalah bentuk enkapsulasi logika bisnis.
 * Mekanisme hashing password disembunyikan di dalam Model sehingga objek lain 
 * tidak perlu mengetahui detail implementasi keamanan data (Information Hiding).
 */
// Middleware Hashing Password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * [POLYMORPHISM & METHOD DEFINITION]
 * Method 'comparePassword' memberikan perilaku seragam bagi semua instance User.
 * Ini memungkinkan objek untuk merespons input yang berbeda melalui interface 
 * atau kontrak metode yang sama.
 */
// Method Compare Password 
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

/**
 * [INHERITANCE - DISCRIMINATOR]
 * Penggunaan Discriminator adalah implementasi konkret dari konsep Pewarisan.
 * Model 'Owner' dan 'Admin' bertindak sebagai Sub-class yang mewarisi (inherit) 
 * seluruh properti dan metode dari Super-class 'User'.
 */
const Owner = User.discriminator('owner', new mongoose.Schema({
    adminCount: { type: Number, default: 0 },
    roomCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    
    //URL Gambar QRIS Statis
    qrisImageUrl: { 
        type: String, 
        default: null
    },
}));

// Sub-class Admin: Memiliki atribut spesifik 'ownerId' namun tetap memegang identitas 'User'.
const Admin = User.discriminator('admin', new mongoose.Schema({
    
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}));

module.exports = { User, Owner, Admin };