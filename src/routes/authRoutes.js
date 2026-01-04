const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); 

// Register Owner
router.post('/register/owner', authController.registerOwner); 

// register Admin
router.post('/register/admin', authMiddleware, authController.registerAdmin); 

// login
router.post('/login', authController.login);

// logout
router.post('/logout', authController.logout);

module.exports = router;