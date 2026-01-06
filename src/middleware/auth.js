const jwt = require('jsonwebtoken');
const Models = require('../models/User'); 
const { User } = Models; // Fix import

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) { 
             return res.status(401).json({ 
                 success: false, 
                 message: 'No token provided, access denied' 
             });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 💡 LOG KRUSIAL 1: Cek ID di Token
        console.log('✅ Token Decoded. ID di Token:', decoded.userId); 
        
        // Query menggunakan findById
        const user = await User.findById(decoded.userId); 

        // 💡 LOG KRUSIAL 2: Cek Hasil Query DB
        console.log('✅ Query Result (null/object):', user); 

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed: User not found or token invalid.'
            });
        }

        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        console.log('Auth success. Lanjut ke Controller.');
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