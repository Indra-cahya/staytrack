const { Room, User } = require('../models');

/**
 * [ABSTRACTION]
 * Class RoomController mengabstraksi seluruh proses pengelolaan data fisik kamar
 * ke dalam method-method logis seperti create, get, update, dan delete.
 */
class RoomController {

    // === [CREATE] ===
    static async createRoom(req, res) {
        try {
            const { roomNumber, type, priceMonthly, priceDaily, capacity, facilities } = req.body;
            
            const existingRoom = await Room.findOne({ roomNumber });
            if (existingRoom) {
                return res.status(409).json({ 
                    success: false, 
                    message: `Kamar nomor ${roomNumber} sudah terdaftar.` 
                });
            }
            
            /**
             * [INSTANTIATION & ENCAPSULATION]
             * Membuat instance objek baru dari Class 'Room' dan membungkus data atributnya.
             */
            const newRoom = new Room({
                roomNumber,
                type,
                price: priceMonthly || 0, 
                priceMonthly: priceMonthly || 0,
                priceDaily: priceDaily || 0,
                capacity,
                facilities: facilities || [],
                status: 'available'
            });

            await newRoom.save();

            res.status(201).json({
                success: true,
                message: `Kamar ${roomNumber} (${type}) berhasil ditambahkan.`,
                data: newRoom
            });

        } catch (error) {
            console.error('💥 Error creating room:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error saat membuat kamar baru.',
                error: error.message
            });
        }
    }

    // === [READ] ===
    static async getRooms(req, res) {
        try {
            /**
             * [OBJECT RELATIONSHIP / AGGREGATION]
             * Melakukan 'populate' untuk menghubungkan objek Kamar dengan objek Penyewa (currentTenant).
             */
            const rooms = await Room.find({})
                .populate({
                    path: 'currentTenant', 
                    select: 'name phone idNumber' 
                })
                .select('-__v')
                .sort({ roomNumber: 1 });

            res.json({
                success: true,
                message: 'Daftar semua kamar berhasil diambil.',
                data: rooms,
                count: rooms.length
            });

        } catch (error) {
            console.error('💥 Error getting rooms:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error saat mengambil data kamar.',
                error: error.message
            });
        }
    }

    // === [UPDATE] ===
    static async updateRoom(req, res) {
        try {
            const { id } = req.params;
            let updateData = req.body;

            /**
             * [DATA INTEGRITY / ENCAPSULATION]
             */
            if (updateData.priceMonthly) {
                updateData.price = updateData.priceMonthly;
            }

            const updatedRoom = await Room.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
                res.json({
                    success: true,
                    message: `Kamar ${updatedRoom.roomNumber} berhasil diperbarui.`,
                    data: updatedRoom
                });

        } catch (error) {
            console.error('💥 Error updating room:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error saat memperbarui kamar.',
                error: error.message
            });
        }
    }

    // === [DELETE] ===
    static async deleteRoom(req, res) {
        try {
            const { id } = req.params; 
            const room = await Room.findById(id);

            if (!room) {
                return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
            }

            /**
             * [STATE VALIDATION & DATA PROTECTION]
             * Melindungi integritas objek: Kamar dengan state 'occupied' dilarang dihapus.
             */
            if (room.status === 'occupied') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Kamar ${room.roomNumber} sedang diisi. Mohon lakukan checkout penyewa terlebih dahulu sebelum menghapus kamar.` 
                });
            }

            await Room.findByIdAndDelete(id);

            res.json({
                success: true,
                message: `Kamar ${room.roomNumber} berhasil dihapus.`,
                data: null
            });

        } catch (error) {
            console.error('💥 Error deleting room:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error saat menghapus kamar.',
                error: error.message
            });
        }
    }
}

module.exports = RoomController;