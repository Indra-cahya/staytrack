const Models = require('../models/User'); 
const { User, Admin, Owner } = Models; 
const bcrypt = require('bcryptjs');
const Room = require('../models/Room'); 
const Tenant = require('../models/Tenant'); 
const Payment = require('../models/Payment');

/**
 * [ABSTRACTION]
 */
class AdminController {
    
    // === [CREATE] ===
    static async createAdmin(req, res) {
        try {
            const { name, email, password, phone } = req.body;
            const ownerId = req.userId; 

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
            }

            /**
             * [INSTANTIATION & INHERITANCE]
             */
            const admin = new Admin({
                name, email, password, phone,
                role: 'admin',
                ownerId: ownerId 
            });

            /**
             * [ENCAPSULATION]
             */
            await admin.save();

            /**
             * [OBJECT INTERACTION]
             */
            await Owner.findByIdAndUpdate(
                ownerId, 
                { $inc: { adminCount: 1 } }
            );

            res.status(201).json({
                success: true,
                message: 'Admin berhasil dibuat',
                data: { name: admin.name, email: admin.email }
            });

        } catch (error) {
            console.error('Error Backend:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error membuat admin',
                error: error.message
            });
        }
    }

    // === [READ] ===
    static async getAdmins(req, res) {
        try {
            const ownerId = req.userId;

            /**
             * [ABSTRACTION]
             */
            const admins = await Admin.find({ ownerId })
                .select('-password')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: admins,
                count: admins.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error mengambil data admin',
                error: error.message
            });
        }
    }

    // === [DELETE] ===
    static async deleteAdmin(req, res) {
        try {
            const { adminId } = req.params;
            const ownerId = req.userId;

            /**
             * [DATA PROTECTION / ENCAPSULATION]
             */
            const admin = await Admin.findOne({ _id: adminId, ownerId });
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin tidak ditemukan'
                });
            }

            await Admin.deleteOne({ _id: adminId });

            /**
             * [OBJECT INTERACTION & STATE SYNCHRONIZATION]
             */
            await Owner.findOneAndUpdate(
                { _id: ownerId },
                { $inc: { adminCount: -1 } }
            );

            res.json({
                success: true,
                message: 'Admin berhasil dihapus'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error menghapus admin',
                error: error.message
            });
        }
    }

    // === [UPDATE / RESET] ===
    static async resetPassword(req, res) {
        try {
            const { adminId } = req.params;
            const ownerId = req.userId;
            const { newPassword } = req.body;

            const admin = await Admin.findOne({ _id: adminId, ownerId });
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin tidak ditemukan'
                });
            }

            /**
             * [ENCAPSULATION & POLYMORPHISM (via Middleware Hooks)]
             */
            admin.password = newPassword;
            await admin.save();

            res.json({
                success: true,
                message: 'Password admin berhasil direset'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error reset password',
                error: error.message
            });
        }
    }
}

module.exports = AdminController;