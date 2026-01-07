const Payment = require('../models/Payment'); 
const Tenant = require('../models/Tenant'); 
const Room = require('../models/Room');
const mongoose = require('mongoose'); 

/**
 * [ABSTRACTION]
 * Class ini menyembunyikan kompleksitas pengolahan transaksi pembayaran 
 * dan pembuatan laporan keuangan.
 */
class PaymentController {

    // === [CREATE] ===
    static async createPayment(req, res) {
        try {
            const { tenantId, roomId, amount, paymentMethod, proofImage, notes } = req.body;
            const adminId = req.userId;
            
            /**
             * [OBJECT INTERACTION]
             * Berinteraksi dengan objek Tenant dan Room untuk validasi data.
             */
            const tenant = await Tenant.findById(tenantId);
            const room = await Room.findById(roomId);
            
            if (!tenant || !room) {
                return res.status(404).json({ message: 'Data Penyewa atau Kamar tidak ditemukan.' });
            }

            /**
             * [INSTANTIATION & ENCAPSULATION]
             * Membuat instance baru dari class Payment dan membungkus datanya.
             */
            const newPayment = new Payment({
                tenantId,
                roomId,
                amount,
                paymentMethod: paymentMethod || 'CASH', 
                rentalType: rentalType || 'monthly',
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

    // === [READ & REPORTING] ===
    static async getReports(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let matchCondition = {};

            if (startDate || endDate) {
                matchCondition.createdAt = {}; 
                if (startDate) {
                    matchCondition.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchCondition.createdAt.$lte = end;
                }
            }

            /**
             * [DATA AGGREGATION / OBJECT RELATIONSHIP]
             * Melakukan join antar-koleksi (Tenant & Room) untuk membentuk 
             * satu kesatuan informasi objek laporan.
             */
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
                    status: 1,
                    rentalType: 1, 
                    method: { 
                        $ifNull: [
                            "$paymentMethod", 
                            { $arrayElemAt: ["$tenant.preferredPaymentMethod", 0] }
                        ] 
                    },
                    createdAt: 1
                }
            }
            ]);

            /**
             * [DATA TRANSFORM / ABSTRACTION]
             */
            const formattedPayments = payments.map(p => {
                return {
                    tenantName: p.tenantName || '-',
                    roomNumber: p.roomNumber || '-',
                    amount: p.amount || 0,
                    method: p.method || '-', 
                    status: p.status || 'unknown',
                    rentalType: p.rentalType || 'monthly',
                    date: p.createdAt
                };
            });

            // [LOGIC ENCAPSULATION] - Kalkulasi total income di dalam method.
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