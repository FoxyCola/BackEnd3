// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middlewares/authMiddlewares'); // ¡Ajuste aquí!

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (User/Admin)
router.post('/', protect, orderController.createOrder); // Usamos 'protect'

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the authenticated user
// @access  Private (User/Admin)
router.get('/my-orders', protect, orderController.getUserOrders); // Usamos 'protect'

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorizeRoles('admin'), orderController.getAllOrders); // Usamos 'protect' y 'authorizeRoles'

module.exports = router;