// src/controllers/TenantController.js
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant'); 
const Room = require('../models/Room'); 
const { User } = require('../models/User'); 

/**
 * [ABSTRACTION - TENANCY MANAGEMENT LAYER]
 * Class ini mengabstraksikan siklus hidup penyewa, mulai dari Check-in 
 * hingga Check-out, serta memastikan integritas data antar objek terkait.
 */
class TenantController {
    /**
     * [ATOMICITY & OBJECT INTERACTION]
     * Metode createTenant menggunakan Database Transaction. 
     * Ini memastikan interaksi antara objek Tenant, Room, dan Payment 
     * bersifat atomik (semua berhasil atau tidak sama sekali).
     */
    static async createTenant(req, res) {
    const session = await mongoose.startSession(); 
    session.startTransaction();

    try {
        // 1. TAMBAHIN rentalType, dueDate, checkoutDate di sini
        const { name, phone, idNumber, roomId, paymentMethod, rentalType, dueDate, checkoutDate } = req.body;
        const adminId = req.userId; 
        
        const existingTenant = await Tenant.findOne({ idNumber }).session(session);
        if (existingTenant) {
            await session.abortTransaction();
            return res.status(409).json({ message: 'No. KTP sudah terdaftar.' });
        }

        const room = await Room.findOneAndUpdate(
            { _id: roomId, status: 'available' },
            { $set: { status: 'occupied' } },
            { new: true, session }
        );

        if (!room) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Kamar tidak tersedia.' });
        }
        
        // 2. SIMPAN rentalType & Tanggal Terkait
        const newTenant = new Tenant({
            name,
            phone,
            idNumber,
            roomId: room._id, 
            adminId,
            isActive: true,
            rentalType: rentalType || 'monthly', // Biar gak default ke bulanan terus
            preferredPaymentMethod: paymentMethod,
            dueDate: rentalType === 'monthly' ? dueDate : null,
            checkoutDate: rentalType === 'daily' ? checkoutDate : null
        });

        await newTenant.save({ session });
        
        await Room.findByIdAndUpdate(roomId, { currentTenant: newTenant._id }, { session });

        // 3. LOGIC HARGA DINAMIS (Harian vs Bulanan)
        if (paymentMethod) {
            const Payment = require('../models/Payment');
            // Pilih harga sesuai tipe sewa
            const finalPrice = (rentalType === 'daily') ? (room.priceDaily || 0) : (room.priceMonthly || room.price);

            const newPayment = new Payment({
                tenantId: newTenant._id,
                roomId: room._id,
                adminId: adminId,
                method: paymentMethod,
                amount: finalPrice, // SEKARANG DINAMIS!
                rentalType: rentalType, // Biar masuk laporan yang bener
                note: `Pembayaran awal (${rentalType}) - Kamar ${room.roomNumber}`,
                status: 'completed'
            });
            await newPayment.save({ session });
        }

        await session.commitTransaction(); 
        res.status(201).json({ success: true, message: 'Penyewa berhasil ditambahkan!' });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Error simpan penyewa', error: error.message });
    } finally {
        session.endSession();
    }
}

    static async checkoutTenant(req, res) {
        const session = await mongoose.startSession(); 
        session.startTransaction();

        try {
            const { id } = req.params; // ID Penyewa yang akan checkout
            
            // 1. Cari Penyewa
            const tenant = await Tenant.findById(id).session(session);

            if (!tenant) {
                await session.abortTransaction();
                return res.status(404).json({ message: 'Data Penyewa tidak ditemukan.' });
            }
            
            if (tenant.isActive === false) {
                 await session.abortTransaction();
                 return res.status(400).json({ message: 'Penyewa ini sudah berstatus tidak aktif (sudah checkout).' });
            }

            const roomId = tenant.roomId;

            // 2. Update Kamar: Set status menjadi 'available' dan bersihkan currentTenant
            const room = await Room.findByIdAndUpdate(
                roomId,
                { 
                    status: 'available',
                    currentTenant: null 
                },
                { new: true, session }
            );

            // 3. Update Penyewa: Tandai sebagai tidak aktif dan catat tanggal checkout
            const updatedTenant = await Tenant.findByIdAndUpdate(
                id,
                { 
                    isActive: false, 
                    checkoutDate: Date.now() 
                },
                { new: true, session }
            );

            if (!room) {
                 await session.abortTransaction();
                 return res.status(404).json({ message: 'Kamar terkait tidak ditemukan (Error integritas data).' });
            }

            // 4. Commit Transaction
            await session.commitTransaction();
            
            res.json({
                success: true,
                message: `Penyewa ${updatedTenant.name} berhasil checkout. Kamar ${room.roomNumber} kini berstatus 'available'.`,
                data: { tenant: updatedTenant, room: room }
            });

        } catch (error) {
            await session.abortTransaction();
            console.error('💥 Error during tenant checkout:', error);
            res.status(500).json({ message: 'Server error saat memproses checkout penyewa.', error: error.message });
        } finally {
            session.endSession();
        }
    }
    /**
     * [ENCAPSULATION - DATA FILTERING]
     * Mengambil koleksi objek berdasarkan kriteria status (isActive: true).
     */
        static async getAllTenants(req, res) {
        try {
            // Hanya tampilkan penyewa yang statusnya masih aktif (isActive: true)
            const tenants = await Tenant.find({ isActive: true })
                .populate({
                    path: 'roomId',
                    select: 'roomNumber price status type' 
                })
                .select('-__v')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                message: 'Daftar penyewa aktif berhasil diambil.',
                data: tenants,
                count: tenants.length
            });
        } catch (error) {
            console.error('💥 Error getting active tenants:', error);
            res.status(500).json({ message: 'Server error saat mengambil data penyewa.', error: error.message });
        }
    }
// src/controllers/TenantController.js (Tambahkan function ini)

    static async getTenantDetail(req, res) {
        try {
            const { id } = req.params;
            
            const tenant = await Tenant.findById(id)
                .populate({
                    path: 'roomId',
                    select: 'roomNumber price status type'
                })
                .select('-__v -adminId'); // Hilangkan field internal dari response

            if (!tenant) {
                return res.status(404).json({ message: 'Penyewa tidak ditemukan.' });
            }

            res.json({
                success: true,
                message: 'Detail penyewa berhasil diambil.',
                data: tenant
            });
        } catch (error) {
            console.error('💥 Error getting tenant detail:', error);
            res.status(500).json({ message: 'Server error saat mengambil detail penyewa.', error: error.message });
        }
    }
        static async updateTenant(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Cek duplikasi KTP jika field idNumber diubah
            if (updateData.idNumber) {
                const existingTenant = await Tenant.findOne({ 
                    idNumber: updateData.idNumber, 
                    _id: { $ne: id } // Kecuali penyewa yang sedang di-update
                });
                if (existingTenant) {
                    return res.status(409).json({ message: 'No. KTP sudah digunakan oleh penyewa lain.' });
                }
            }

            // Cari dan update
            const updatedTenant = await Tenant.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true } // new: true: mengembalikan data terbaru
            ).select('-__v -adminId');

            if (updateData.idNumber) {
            const existingTenant = await Tenant.findOne({ 
                idNumber: updateData.idNumber, 
                _id: { $ne: id } 
            });
            if (existingTenant) {
                return res.status(409).json({ message: 'No. KTP sudah digunakan oleh penyewa lain.' });
            }
        }

            res.json({
                success: true,
                message: 'Data penyewa berhasil diperbarui.',
                data: updatedTenant
            });
        } catch (error) {
            console.error('💥 Error updating tenant:', error);
            res.status(500).json({ message: 'Server error saat memperbarui data penyewa.', error: error.message });
        }
    }
}

module.exports = TenantController;