const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['owner', 'admin'], required: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Middleware Hashing Password (Encapsulation)
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

// Method Parent (Inheritance Base)
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// [ABSTRACTION & POLYMORPHISM BASE]
userSchema.methods.getAccessProfile = function() {
    return {
        role: this.role,
        permissions: ['view_profile']
    };
};

const User = mongoose.model('User', userSchema);

// === SUB-CLASS OWNER ===
const Owner = User.discriminator('owner', new mongoose.Schema({
    adminCount: { type: Number, default: 0 },
    roomCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
}));

// [POLYMORPHISM - OVERRIDING FOR OWNER]
Owner.prototype.getAccessProfile = function() {
    return {
        role: 'owner',
        permissions: ['manage_all', 'manage_admin', 'view_reports'],
        accessLevel: 1
    };
};

// === SUB-CLASS ADMIN ===
const Admin = User.discriminator('admin', new mongoose.Schema({
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}));

// [POLYMORPHISM - OVERRIDING FOR ADMIN]
Admin.prototype.getAccessProfile = function() {
    return {
        role: 'admin',
        permissions: ['manage_tenants', 'manage_rooms'],
        accessLevel: 2
    };
};

module.exports = { User, Owner, Admin };