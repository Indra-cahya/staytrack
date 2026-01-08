const Models = require('../models/User'); 
const { User, Owner, Admin } = Models; 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * [ABSTRACTION]
 */
class AuthController {
    
    // === [REGISTER OWNER] ===
    static async registerOwner(req, res) {
        try {
            const { name, email, password, phone } = req.body;

            const existingOwner = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingOwner) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Owner already exists' 
                });
            }

            /**
             * [INSTANTIATION & INHERITANCE]
             */
            const owner = new Owner({ 
                name,
                email: email.toLowerCase().trim(),
                password,
                role: 'owner', 
                phone,
                isActive: true
            });

            /**
             * [ENCAPSULATION]
             */
            await owner.save();

            const token = jwt.sign(
                { userId: owner._id, role: owner.role }, 
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                data: {
                    _id: owner._id, 
                    name: owner.name,
                    email: owner.email,
                    role: 'owner',
                    token
                }
            });

        } catch (error) {
            console.error('💥 Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }

    // === [REGISTER ADMIN] ===
    static async registerAdmin(req, res) {
        try {
            /**
             * [AUTHORIZATION / DATA PROTECTION]
             */
            if (req.user.role !== 'owner') { 
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied. Only Owner can create Admin accounts.'
                });
            }

            const { name, email, password, phone } = req.body;
            const ownerId = req.user._id; 

            const existingAdmin = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingAdmin) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User already exists with this email' 
                });
            }

            /**
             * [INSTANTIATION & INHERITANCE]
             */
            const admin = new Admin({ 
                name,
                email: email.toLowerCase().trim(),
                password,
                role: 'admin', 
                phone,
                isActive: true,
                ownerId: ownerId 
            });

            await admin.save();

            /**
             * [OBJECT INTERACTION]
             */
            await Owner.findByIdAndUpdate(ownerId, { $inc: { adminCount: 1 } });
            
            res.status(201).json({
                success: true,
                message: 'Admin created successfully by Owner.',
                data: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: 'admin',
                    ownerId: admin.ownerId
                }
            });

        } catch (error) {
            console.error('💥 Register Admin Error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }

    // === [LOGIN] ===
    /**
     * [POLYMORPHISM]
     * Method login dapat melayani objek 'Admin' maupun 'Owner' secara dinamis.
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email dan password wajib diisi'
                });
            }

            const user = await User.findOne({ 
                email: email.toLowerCase().trim() 
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const allowedRoles = ['owner', 'admin'];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only owner and admin can log in'
                });
            }

            /**
             * [ENCAPSULATION / INTERFACE INTERACTION]
             * Memanggil method internal objek '.comparePassword'
             */
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Username or Password'
                });
            }
            const accessProfile = user.getAccessProfile();
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    access: accessProfile,
                    token
                }
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error saat login.',
                error: error.message
            });
        }
    }

    // === [PROFILE] ===
    static async getProfile(req, res) {
        try {
            /**
             * [ABSTRACTION]
             */
            const user = await User.findOne({ _id: req.userId }).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // === [LOGOUT] ===
    /**
     * [STATE MANAGEMENT]
     */
    static async logout(req, res) {
        try {
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;