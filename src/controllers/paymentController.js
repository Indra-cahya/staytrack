const Payment = require('../models/Payment'); 
const Tenant = require('../models/Tenant'); 
const Room = require('../models/Room');
const mongoose = require('mongoose'); 

/**
 * [ABSTRACTION - FINANCIAL LOGIC LAYER]
 * Class PaymentController mengabstraksikan seluruh proses transaksi keuangan.
 * Ia menyembunyikan kompleksitas query database (Aggregation) di balik 
 * interface metode statis yang sederhana.
 */
class PaymentController {
    /**
     * [OBJECT INTERACTION & STATE VALIDATION]
     * Metode ini menunjukkan bagaimana objek Payment berinteraksi dengan 
     * objek Tenant dan Room. Sebelum instansiasi 'Payment' dilakukan, 
     * sistem memvalidasi keberadaan 'State' dari objek terkait.
     */
    static async createPayment(req, res) {
    try {
        // 1. Pastiin nangkep paymentMethod (sesuai yang kita ganti di frontend tadi)
        const { tenantId, roomId, amount, paymentMethod, proofImage, notes } = req.body;
        const adminId = req.userId;
        
        const tenant = await Tenant.findById(tenantId);
        const room = await Room.findById(roomId);
        
        if (!tenant || !room) {
            return res.status(404).json({ message: 'Data Penyewa atau Kamar tidak ditemukan.' });
        }

        const newPayment = new Payment({
            tenantId,
            roomId,
            amount,
            // 2. PASTIKAN INI MASUK KE DATABASE
            paymentMethod: paymentMethod || 'CASH', 
            status: 'paid',
            proofImage: proofImage || null,
            verifiedBy: adminId,
            verifiedAt: Date.now(),
            notes: notes || ''
        });

        await newPayment.save();
        
        res.status(201).json({
            success: true,
            message: 'Pembayaran berhasil dicatat!',
            data: newPayment
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
    /**
         * [COMPLEX DATA ABSTRACTION - AGGREGATION]
         * Metode getReports menggunakan 'Aggregation Pipeline'. 
         * Dalam OOP, ini adalah cara kita melakukan pemrosesan data tingkat tinggi 
         * untuk menghasilkan informasi (Report) dari kumpulan objek mentah (Payments).
         */
    static async getReports(req, res) {
    try {
        const { startDate, endDate } = req.query;
        let matchCondition = {};

        if (startDate || endDate) {
            matchCondition.createdAt = {}; 
            if (startDate) {
                // Gunakan format ISO yang aman
                matchCondition.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set ke akhir hari (23:59:59) biar transaksi hari itu ikut masuk
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchCondition.createdAt.$lte = end;
            }
        }

        const payments = await Payment.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'tenants',
                    localField: 'tenantId',
                    foreignField: '_id',
                    as: 'tenant'
                }
            },
            {
                $lookup: {
                    from: 'rooms',
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'room'
                }
            },
            {
                $addFields: {
                    // Pastikan field penangkapan metode sinkron
                    finalMethod: { 
                        $ifNull: ["$paymentMethod", { $ifNull: ["$paymentType", "CASH"] }] 
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    tenantName: { $arrayElemAt: ["$tenant.name", 0] },
                    roomNumber: { $arrayElemAt: ["$room.roomNumber", 0] },
                    amount: 1,
                    method: "$finalMethod",
                    status: 1,
                    createdAt: 1
                }
            }
        ]);

        // Mapping Data untuk Frontend
        const formattedPayments = payments.map(p => {
            return {
                tenantName: p.tenantName || '-',
                roomNumber: p.roomNumber || '-',
                amount: p.amount || 0,
                method: p.method || '-', 
                status: p.status || 'unknown',
                date: p.createdAt // Konsisten ambil dari createdAt
            };
        });

        // Hitung Summary dengan satu kali looping (Lebih Efisien)
        let totalIncome = 0;
        let successfulCount = 0;
        let pendingCount = 0;

        payments.forEach(p => {
            const s = (p.status || '').toLowerCase();
            if (s === 'paid' || s === 'completed') {
                totalIncome += (p.amount || 0);
                successfulCount++;
            } else {
                pendingCount++;
            }
        });

        res.json({
            success: true,
            data: {
                totalIncome,
                successfulPayments: successfulCount,
                pendingPayments: pendingCount,
                payments: formattedPayments
            }
        });
        } catch (error) {
        console.error('💥 Error Get Reports:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
}
module.exports = PaymentController;