const multer = require('multer');
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `proof_${Date.now()}${path.extname(file.originalname)}`);
    }
});
module.exports = multer({ storage });