// src/middleware/roleCheck.js
const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.userRole; // dari authMiddleware

        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user role not found'
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: insufficient permissions'
            });
        }

        next();
    };
};

module.exports = roleCheck;