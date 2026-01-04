const Models = require('../models/User'); // Ganti path kalau beda
const { User, Owner, Admin } = Models; 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * [ABSTRACTION - ACCESS CONTROL LAYER]
 * AuthController mengabstraksikan seluruh proses autentikasi dan otorisasi.
 * Class ini berfungsi sebagai interface tunggal untuk mengelola kredensial 
 * berbagai entitas user tanpa mengekspos detail teknis JWT atau hashing.
 */
class AuthController {
    // Register Owner (hanya untuk pertama kali)
    static async registerOwner(req, res) {
    try {
        const { name, email, password, phone } = req.body;

        // Cek Owner yang sudah ada
        const existingOwner = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingOwner) {
            return res.status(400).json({ 
                success: false, 
                message: 'Owner already exists' 
            });
        }

        /**
         * [SUB-CLASS INSTANTIATION]
         * Di sini kita secara eksplisit membuat instance dari sub-class 'Owner'.
         * Meskipun 'Owner' mewarisi sifat 'User', kita menggunakan constructor 
         * spesifik agar atribut unik Owner (seperti adminCount) terinisialisasi.
         */
        const owner = new Owner({ 
            name,
            email: email.toLowerCase().trim(),
            password,
            role: 'owner', 
            phone,
            isActive: true
        });

        await owner.save();

        
        const token = jwt.sign(
            { userId: owner._id, role: 'owner.role' }, 
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
    static async registerAdmin(req, res) {
            try {
                // Kita asumsikan req.user sudah di-set oleh Auth Middleware
                // yang berisi data owner._id yang sedang login
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
                 * [SPECIALIZATION & OBJECT INTERACTION]
                 * Membuat instance 'Admin' yang memiliki field khusus 'ownerId'.
                 * Ini menunjukkan 'Admin' adalah spesialisasi dari 'User'.
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

                // Memperbarui state pada objek Owner (Encapsulated interaction)
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
        /**
     * [POLYMORPHISM IN LOGIN]
     * Perhatikan metode login ini. Kita memanggil 'User.findOne', bukan Admin atau Owner.
     * Ini adalah 'Polymorphism', di mana kita memperlakukan sub-class sebagai tipe 
     * super-classnya (User) saat melakukan operasi umum seperti login.
     */
        // Login untuk owner dan admin
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email dan password wajib diisi'
                });
            }

            console.log('🔐 Login attempt for:', email);

            // Cari user
            const user = await User.findOne({ 
                email: email.toLowerCase().trim() 
            });

            if (!user) {
                console.log('❌ User not found');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Validasi role (hanya owner & admin)
            const allowedRoles = ['owner', 'admin'];
            if (!allowedRoles.includes(user.role)) {
                console.log('❌ Role not allowed:', user.role);
                return res.status(403).json({
                    success: false,
                    message: 'Only owner and admin can log in'
                });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Username or Password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log('🎉 Login successful for:', user.email);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token
                }
            });

        } catch (error) {
        //log error
        console.error('FATAL LOGIN CRASH:', error.message, error.stack); 
        
        // Kirim response 500 JSON agar frontend tidak crash dengan HTML
        return res.status(500).json({
            success: false,
            message: 'Server error saat login. Cek console backend.',
            error: error.message
        });
        }
    }
    // Get current user profile
    static async getProfile(req, res) {
        try {
            // Ambil user dari token (role sudah divalidasi di middleware)
            const user = await User.findOne({ _id: req.userId }).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!['admin', 'owner'].includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
        }
    }

    // Logout 
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