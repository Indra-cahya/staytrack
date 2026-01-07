const multer = require('multer');
const path = require('path'); // Pastikan path di-require ya Bos biar ga error

/**
 * [ABSTRACTION & CONFIGURATION]
 * Mengabstraksi proses penyimpanan file fisik ke dalam sebuah objek storage.
 */
const storage = multer.diskStorage({
    /**
     * [ENCAPSULATION]
     * Menentukan lokasi penyimpanan file dalam satu properti objek.
     */
    destination: 'public/uploads/',
    
    /**
     * [POLYMORPHISM / CALLBACK PATTERN]
     * Method ini menentukan penamaan file secara dinamis berdasarkan waktu (state).
     */
    filename: (req, file, cb) => {
        cb(null, `proof_${Date.now()}${path.extname(file.originalname)}`);
    }
});

/**
 * [INSTANTIATION]
 * Membuat instance middleware multer dengan konfigurasi yang sudah di-enkapsulasi.
 */
module.exports = multer({ storage });