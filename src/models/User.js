const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


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


// Method Compare Password 
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);


const Owner = User.discriminator('owner', new mongoose.Schema({
    adminCount: { type: Number, default: 0 },
    roomCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
}));

const Admin = User.discriminator('admin', new mongoose.Schema({
    
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}));

module.exports = { User, Owner, Admin };