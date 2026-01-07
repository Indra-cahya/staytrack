const mongoose = require('mongoose');
const Tenant = require('../models/Tenant'); 
const Room = require('../models/Room'); 
const { User } = require('../models/User'); 

/**
 * [ABSTRACTION]
 * Class TenantController menyembunyikan kompleksitas manajemen siklus hidup penyewa,
 * mulai dari check-in, pendataan, hingga proses checkout.
 */
class TenantController {

    // === [CREATE / CHECK-IN] ===
    static async createTenant(req, res) {
        const session = await mongoose.startSession(); 
        session.startTransaction();

        try {
            const { name, phone, idNumber, roomId, paymentMethod, rentalType, dueDate, checkoutDate } = req.body;
            const adminId = req.userId; 
            
            const existingTenant = await Tenant.findOne({ idNumber }).session(session);
            if (existingTenant) {
                await session.abortTransaction();
                return res.status(409).json({ message: 'No. KTP sudah terdaftar.' });
            }

            /**
             * [OBJECT INTERACTION & MUTATION]
             * Berinteraksi dengan objek 'Room' untuk mengubah state status menjadi 'occupied'.
             */
            const room = await Room.findOneAndUpdate(
                { _id: roomId, status: 'available' },
                { $set: { status: 'occupied' } },
                { new: true, session }
            );

            if (!room) {
                await session.abortTransaction();
                return res.status(400).json({ message: 'Kamar tidak tersedia.' });
            }

            /**
             * [INSTANTIATION]
             * Membuat instance objek baru dari Class 'Tenant'.
             */
            const newTenant = new Tenant({
                name,
                phone,
                idNumber,
                roomId: room._id, 
                adminId,
                isActive: true,
                rentalType: rentalType || 'monthly', 
                preferredPaymentMethod: paymentMethod,
                dueDate: rentalType === 'monthly' ? dueDate : null,
                checkoutDate: rentalType === 'daily' ? checkoutDate : null
            });

            await newTenant.save({ session });
            
            // [OBJECT INTERACTION] - Menghubungkan ID objek Tenant ke dalam atribut objek Room.
            await Room.findByIdAndUpdate(roomId, { currentTenant: newTenant._id }, { session });

            if (paymentMethod) {
                const Payment = require('../models/Payment');
                const finalPrice = (rentalType === 'daily') ? (room.priceDaily || 0) : (room.priceMonthly || room.price);

                /**
                 * [OBJECT INTERACTION]
                 * Membuat objek 'Payment' sebagai hasil interaksi antara Tenant dan Room.
                 */
                const newPayment = new Payment({
                    tenantId: newTenant._id,
                    roomId: room._id,
                    adminId: adminId,
                    method: paymentMethod,
                    amount: finalPrice, 
                    rentalType: rentalType, 
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

    // === [DELETE / CHECKOUT] ===
    static async checkoutTenant(req, res) {
        const session = await mongoose.startSession(); 
        session.startTransaction();

        try {
            const { id } = req.params; 
            
            const tenant = await Tenant.findById(id).session(session);

            if (!tenant) {
                await session.abortTransaction();
                return res.status(404).json({ message: 'Data Penyewa tidak ditemukan.' });
            }
            
            /**
             * [STATE VALIDATION]
             */
            if (tenant.isActive === false) {
                 await session.abortTransaction();
                 return res.status(400).json({ message: 'Penyewa ini sudah berstatus tidak aktif (sudah checkout).' });
            }

            const roomId = tenant.roomId;

            /**
             * [OBJECT INTERACTION / STATE SYNCHRONIZATION]
             * Mengembalikan state objek 'Room' menjadi tersedia setelah objek 'Tenant' checkout.
             */
            const room = await Room.findByIdAndUpdate(
                roomId,
                { 
                    status: 'available',
                    currentTenant: null 
                },
                { new: true, session }
            );

            /**
             * [ENCAPSULATION / DATA UPDATE]
             */
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

    // === [READ ALL] ===
    static async getAllTenants(req, res) {
        try {
            /**
             * [OBJECT RELATIONSHIP / POLYMORPHISM (via Population)]
             */
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

    // === [READ DETAIL] ===
    static async getTenantDetail(req, res) {
        try {
            const { id } = req.params;
            
            /**
             * [ABSTRACTION]
             */
            const tenant = await Tenant.findById(id)
                .populate({
                    path: 'roomId',
                    select: 'roomNumber price status type'
                })
                .select('-__v -adminId'); 

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

    // === [UPDATE] ===
    static async updateTenant(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            /**
             * [ENCAPSULATION & DATA PROTECTION]
             */
            if (updateData.idNumber) {
                const existingTenant = await Tenant.findOne({ 
                    idNumber: updateData.idNumber, 
                    _id: { $ne: id } 
                });
                if (existingTenant) {
                    return res.status(409).json({ message: 'No. KTP sudah digunakan oleh penyewa lain.' });
                }
            }

            const updatedTenant = await Tenant.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true } 
            ).select('-__v -adminId');

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