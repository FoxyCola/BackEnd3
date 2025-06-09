// src/routes/cartRoutes.js
const express = require('express');
const {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
} = require('../controllers/cartController');
const { protect, authorizeRoles } = require('../middlewares/authMiddlewares'); // Importa los middlewares

const router = express.Router();

// Todas las rutas del carrito están protegidas y solo accesibles por usuarios normales
router.get('/', protect, authorizeRoles('user'), getUserCart);
router.post('/add', protect, authorizeRoles('user'), addItemToCart);
router.put('/update-quantity/:productId', protect, authorizeRoles('user'), updateCartItemQuantity);
router.delete('/remove/:productId', protect, authorizeRoles('user'), removeItemFromCart);


module.exports = router;