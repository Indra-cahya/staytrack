const { Room, User } = require('../models');
/**
 * [ABSTRACTION - RESOURCE MANAGEMENT]
 * RoomController mengabstraksikan operasi manajemen aset fisik (Kamar).
 * Class ini bertindak sebagai pengendali logika untuk memastikan setiap 
 * instance objek Room dikelola sesuai dengan aturan bisnis.
 */
class RoomController {
    
    /**
     * [INSTANTIATION & VALIDATION]
     * Metode ini menangani instansiasi objek Room baru. 
     * Terdapat pengecekan integritas data (Unique Constraint) sebelum 
     * objek benar-benar disimpan ke dalam persistence layer.
     */
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
        
        // Pastikan kita kirim 'price' (untuk model lama) dan field baru
        const newRoom = new Room({
            roomNumber,
            type,
            price: priceMonthly || 0, // Isi 'price' utama dengan harga bulanan agar validasi model lolos
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

    /**
     * [OBJECT ASSOCIATION - POPULATE]
     * Metode getRooms mendemonstrasikan bagaimana kita menavigasi hubungan 
     * (Association) antar objek. Dengan 'populate', kita mengambil data 
     * dari objek 'Tenant' yang terasosiasi dengan objek 'Room' tersebut.
     */
    static async getRooms(req, res) {
        try {
            // Gunakan populate untuk mendapatkan data penyewa saat kamar terisi
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

    /**
     * [ENCAPSULATION - STATE UPDATE]
     * UpdateRoom mengelola perubahan atribut pada objek. 
     * Penggunaan 'runValidators: true' memastikan bahwa enkapsulasi aturan 
     * pada Model tetap dijalankan saat proses pembaruan data.
     */
static async updateRoom(req, res) {
    try {
        const { id } = req.params;
        let updateData = req.body;

        // Sinkronkan harga lama (price) dengan harga baru agar loadRooms lama gak 0
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

    /**
     * [OBJECT LIFECYCLE & BUSINESS CONSTRAINTS]
     * Sebelum menghapus objek (Destruction), kita melakukan pengecekan State.
     * Jika Room dalam status 'occupied', objek tidak boleh dihapus. 
     * Ini adalah implementasi "Business Rule Validation" dalam siklus hidup objek.
     */
    static async deleteRoom(req, res) {
        try {
            const { id } = req.params; 
            const room = await Room.findById(id);

            if (!room) {
                return res.status(404).json({ success: false, message: 'Kamar tidak ditemukan.' });
            }

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