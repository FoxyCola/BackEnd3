// src/routes/productRoutes.js
const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middlewares/authMiddlewares'); // Importa los middlewares

const router = express.Router();

// Rutas públicas (cualquier usuario puede ver productos)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Rutas protegidas para ADMINISTRADORES
router.post('/', protect, authorizeRoles('admin'), createProduct);
router.put('/:id', protect, authorizeRoles('admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProduct);

module.exports = router;