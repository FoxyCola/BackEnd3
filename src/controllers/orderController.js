// src/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product'); // Necesitamos el modelo de Producto para actualizar el stock

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (User/Admin)
exports.createOrder = async (req, res) => {
  const { userId, items, totalAmount } = req.body;

  // Validar si el userId del token coincide con el userId del body
  // Esto es una medida de seguridad si el token no es el único mecanismo de auth
  if (req.user.id !== userId) {
    return res.status(403).json({ message: 'Acceso denegado. El ID de usuario no coincide.' });
  }

  try {
    // 1. Verificar disponibilidad de stock y descontar stock
    const session = await Order.startSession(); // Iniciar una transacción
    session.startTransaction();

    try {
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para el producto: ${product.name}. Stock disponible: ${product.stock}, solicitado: ${item.quantity}.`);
        }

        // Descontar el stock
        product.stock -= item.quantity;
        await product.save({ session });
      }

      // 2. Crear la orden si todo el stock es suficiente
      const newOrder = new Order({
        userId,
        items,
        totalAmount,
      });

      const savedOrder = await newOrder.save({ session });

      await session.commitTransaction(); // Confirmar la transacción
      res.status(201).json({ message: 'Pedido creado exitosamente', order: savedOrder });

    } catch (error) {
      await session.abortTransaction(); // Abortar la transacción si hay algún error
      console.error('Error durante la transacción de pedido:', error.message);
      // Si el error es de stock insuficiente, enviamos un 400
      if (error.message.includes('Stock insuficiente')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error al crear el pedido', error: error.message });
    } finally {
      session.endSession();
    }

  } catch (err) {
    console.error('Error general al crear el pedido:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the authenticated user
// @access  Private (User/Admin)
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('items.productId');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId').populate('items.productId');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener todas las órdenes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Puedes añadir más funciones como updateOrderStatus, cancelOrder, etc.