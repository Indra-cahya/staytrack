const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');
const roomController = require('../controllers/roomController'); // Import CRUD Room
const tenantController = require('../controllers/tenantController'); // Import Tenant Logic
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
// Hanya owner yang bisa buat admin
router.post('/create', auth, roleCheck('owner'), adminController.createAdmin);

// Get all admins
router.get('/list', auth, roleCheck('owner'), adminController.getAdmins);

// Delete admin
router.delete('/:adminId', auth, roleCheck('owner'), adminController.deleteAdmin);

// Reset password
router.put('/:adminId/reset-password', auth, roleCheck('owner'), adminController.resetPassword);

router.post('/rooms/create', authMiddleware, roomController.createRoom);
//melihat semua kamar
router.get('/rooms', authMiddleware, roomController.getRooms);
router.put('/rooms/:id', authMiddleware, roomController.updateRoom); 
router.delete('/rooms/:id', authMiddleware, roomController.deleteRoom); 
//pembayaran
router.post('/payments/create', authMiddleware, paymentController.createPayment);
// Laporan keuangan
router.get('/reports', authMiddleware, paymentController.getReports);

//input tenant
router.post('/tenants/create', authMiddleware, tenantController.createTenant);
router.get('/tenants', authMiddleware, tenantController.getAllTenants); // Read All Active
router.get('/tenants/:id', authMiddleware, tenantController.getTenantDetail); // Read Detail
router.put('/tenants/:id', authMiddleware, tenantController.updateTenant); // Update Data
router.put('/tenants/checkout/:id', authMiddleware, tenantController.checkoutTenant);
module.exports = router;