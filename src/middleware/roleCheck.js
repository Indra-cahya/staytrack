/**
 * [ABSTRACTION & POLYMORPHISM]
 * Fungsi ini bertindak sebagai 'Guard' yang fleksibel. 
 * Bisa menerima satu atau banyak role sekaligus (Variadic Function).
 */
const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        /**
         * [STATE ACCESS]
         * Mengakses atribut 'userRole' yang sudah di-set oleh objek middleware sebelumnya.
         */
        const userRole = req.userRole; 

        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user role not found'
            });
        }

        /**
         * [ENCAPSULATION / POLICY ENFORCEMENT]
         * Logika perlindungan data: Memastikan objek pengirim (User) 
         * memiliki 'Capability' atau izin yang sesuai.
         */
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: insufficient permissions'
            });
        }

        /**
         * [DELEGATION]
         */
        next();
    };
};

module.exports = roleCheck;