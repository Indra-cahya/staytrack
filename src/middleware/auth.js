const jwt = require('jsonwebtoken');
const Models = require('../models/User'); 
const { User } = Models; 

/**
 * [ABSTRACTION & INTERCEPTION]
 * Middleware ini mengabstraksi proses verifikasi keamanan.
 * Controller tidak perlu tahu cara mengecek token, cukup menerima objek user yang sudah valid.
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) { 
             return res.status(401).json({ 
                 success: false, 
                 message: 'No token provided, access denied' 
             });
        }
        
        /**
         * [DECAPSULATION]
         * Membuka bungkusan token untuk mengambil identitas objek (userId).
         */
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token Decoded. ID di Token:', decoded.userId); 
        const user = await User.findById(decoded.userId); 

        console.log('✅ Query Result (null/object):', user); 

        /**
         * [OBJECT VALIDATION]
         */
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed: User not found or token invalid.'
            });
        }

        /**
         * [STATE TRANSFER]
         * Memindahkan state/atribut dari objek 'User' ke dalam objek 'Request' (req)
         * agar bisa diakses oleh method-method di controller selanjutnya.
         */
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        console.log('Auth success. Lanjut ke Controller.');
        
        /**
         * [DELEGATION]
         * Menyerahkan kontrol eksekusi ke method selanjutnya dalam rantai proses.
         */
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is invalid or expired',
            error: error.message
        });
    }
};

module.exports = authMiddleware;