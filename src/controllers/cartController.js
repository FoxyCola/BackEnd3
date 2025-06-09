// src/controllers/cartController.js
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Obtener el carrito del usuario loggeado
// @route   GET /api/cart
// @access  Private/User
const getUserCart = async (req, res) => {
  try {
    // req.user viene del middleware 'protect'
    const user = await User.findById(req.user._id).populate('cart.product'); // Popula los detalles del producto

    if (user) {
      res.json(user.cart);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al obtener el carrito.' });
  }
};

// @desc    Agregar un producto al carrito o actualizar su cantidad
// @route   POST /api/cart/add
// @access  Private/User
const addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined || quantity < 1) {
    return res.status(400).json({ message: 'Por favor, proporciona un ID de producto válido y una cantidad.' });
  }

  try {
    const user = await User.findById(req.user._id);
    const product = await Product.findById(productId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: `No hay suficiente stock para ${product.name}. Stock disponible: ${product.stock}` });
    }

    // Buscar si el producto ya está en el carrito
    const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Si el producto ya está, actualizar la cantidad
      user.cart[itemIndex].quantity += quantity;
    } else {
      // Si no está, añadirlo como un nuevo item
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    // Opcional: Descontar el stock del producto
    // product.stock -= quantity;
    // await product.save();

    // Volver a poblar el carrito para la respuesta
    await user.populate('cart.product');
    res.status(200).json(user.cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al añadir el producto al carrito.' });
  }
};

// @desc    Actualizar la cantidad de un producto en el carrito
// @route   PUT /api/cart/update-quantity/:productId
// @access  Private/User
const updateCartItemQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 0) { // Permite 0 para eliminar indirectamente
    return res.status(400).json({ message: 'Por favor, proporciona una cantidad válida (>= 0).' });
  }

  try {
    const user = await User.findById(req.user._id);
    const product = await Product.findById(productId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Calcular la diferencia de stock para verificar disponibilidad
      const oldQuantity = user.cart[itemIndex].quantity;
      const quantityChange = quantity - oldQuantity;

      if (quantityChange > 0 && product.stock < quantityChange) {
        return res.status(400).json({ message: `No hay suficiente stock para ${product.name}. Stock disponible: ${product.stock}` });
      }

      if (quantity === 0) {
        user.cart.splice(itemIndex, 1); // Eliminar el item si la cantidad es 0
      } else {
        user.cart[itemIndex].quantity = quantity;
      }
      await user.save();
      // Opcional: Actualizar el stock del producto
      // product.stock -= quantityChange;
      // await product.save();

      await user.populate('cart.product');
      res.json(user.cart);
    } else {
      res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al actualizar la cantidad del carrito.' });
  }
};


// @desc    Eliminar un producto del carrito
// @route   DELETE /api/cart/remove/:productId
// @access  Private/User
const removeItemFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const initialLength = user.cart.length;
    // Filtra el carrito para eliminar el producto con el ID especificado
    user.cart = user.cart.filter(item => item.product.toString() !== productId);

    if (user.cart.length === initialLength) {
        return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
    }

    await user.save();
    // Opcional: Devolver el stock al producto
    // const product = await Product.findById(productId);
    // if (product) {
    //     product.stock += removedItem.quantity;
    //     await product.save();
    // }

    await user.populate('cart.product');
    res.json({ message: 'Producto eliminado del carrito.', cart: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al eliminar el producto del carrito.' });
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
};