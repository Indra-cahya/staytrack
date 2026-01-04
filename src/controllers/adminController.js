const Models = require('../models/User'); 
const { User, Admin, Owner } = Models; // Import User, Admin, Owner dari satu file
const bcrypt = require('bcryptjs');
const Room = require('../models/Room'); // Model Kamar
const Tenant = require('../models/Tenant'); // Model Penyewa
const Payment = require('../models/Payment');

/**
 * [ABSTRACTION & ENCAPSULATION]
 * AdminController bertindak sebagai layer abstraksi yang membungkus logika 
 * operasional administrasi. Dengan menggunakan Class, kita melakukan 
 * enkapsulasi fungsi-fungsi terkait admin ke dalam satu namespace yang teratur.
 */
class AdminController {
    // === [POLYMORPHISM IN PRACTICE] ===
    // Meskipun kita menggunakan model 'Admin', kita tetap bisa melakukan operasi
    // melalui interface 'User'. Namun di sini kita secara spesifik menginisiasi 
    // instance dari 'Admin' yang mewarisi sifat 'User'.
    static async createAdmin(req, res) {
    try {
        const { name, email, password, phone } = req.body;
        const ownerId = req.userId; // Dari auth middleware

        // Cek jika user sudah ada
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }
        /**
         * [INSTANTIATION & INHERITANCE]
         * Baris ini membuat objek baru dari Sub-class 'Admin'.
         * Objek ini secara otomatis memiliki atribut dari Super-class 'User'.
         */
        // Buat admin baru
        const admin = new Admin({
            name,
            email,
            password,
            phone,
            ownerId: req.userId
        });

        await admin.save();

        // [OBJECT INTERACTION]
        // Interaksi antar-objek: Menambah state 'adminCount' pada objek Owner.
        // Update admin count di owner
        await Owner.findOneAndUpdate(
            { _Id: ownerId },
            { $inc: { adminCount: 1 } }
        );

        res.status(201).json({
            success: true,
            message: 'Admin berhasil dibuat',
            data: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                createdAt: admin.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error membuat admin',
            error: error.message
        });
    }
}

    // Owner melihat daftar semua admin
    static async getAdmins(req, res) {
        try {
            const ownerId = req.userId;

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

    // Owner menghapus admin
    static async deleteAdmin(req, res) {
        try {
            const { adminId } = req.params;
            const ownerId = req.userId;

            // Cek jika admin exists dan milik owner ini
            const admin = await Admin.findOne({ _id: adminId, ownerId });
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin tidak ditemukan'
                });
            }

            await Admin.deleteOne({ _id: adminId });
            // Mengelola integritas data antar objek (State Synchronization)
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

    // Reset password admin
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
             * [ENCAPSULATION & BEHAVIOR]
             * Kita tidak mengubah hash secara manual di sini, melainkan hanya 
             * memberikan value baru ke properti 'password'. 
             * Logika enkapsulasi hashing di Model (pre-save) yang akan bekerja.
             */
            // Reset password
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
    // Mengubah Profil Owner (Mengisi QRIS URL)
    static async updateOwnerProfile(req, res) {
        try {
            const ownerId = req.userId; 
            const updateData = req.body; 

            if (req.user.role !== 'owner') { 
                return res.status(403).json({ message: 'Akses Ditolak. Hanya Owner yang bisa mengubah profil utama.' });
            }
            const updatedOwner = await Owner.findByIdAndUpdate(
                ownerId,
                { $set: updateData },
                { new: true, runValidators: true } 
            ).select('-password');

            if (!updatedOwner) {
                return res.status(404).json({ message: 'Profil Owner tidak ditemukan.' });
            }

            res.json({
                success: true,
                message: 'Profil Owner berhasil diperbarui (termasuk QRIS URL).',
                data: updatedOwner
            });

        } catch (error) {
            console.error('Error updating Owner profile:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error saat memperbarui profil.', 
                error: error.message 
            });
        }
    }
}

module.exports = AdminController;