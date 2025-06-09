// src/controllers/productController.js
const Product = require('../models/Product'); // Importa el modelo de Producto

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Encuentra todos los productos
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al obtener los productos.' });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al obtener el producto.' });
  }
};


// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { name, description, price, stock, imageUrl } = req.body;

  // Validación básica
  if (!name || !description || !price || !stock || !imageUrl) {
    return res.status(400).json({ message: 'Por favor, rellena todos los campos del producto.' });
  }

  try {
    // Verificar si ya existe un producto con el mismo nombre
    const productExists = await Product.findOne({ name });
    if (productExists) {
      return res.status(400).json({ message: 'Ya existe un producto con este nombre.' });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      imageUrl,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct); // 201 Created
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al crear el producto.' });
  }
};

// @desc    Actualizar un producto (incluye restockear)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { name, description, price, stock, imageUrl } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name; // Si el campo no se envía, se mantiene el actual
      product.description = description || product.description;
      product.price = price !== undefined ? price : product.price; // Permite price = 0
      product.stock = stock !== undefined ? stock : product.stock; // Permite stock = 0
      product.imageUrl = imageUrl || product.imageUrl;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Producto no encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al actualizar el producto.' });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id }); // Usar deleteOne para mayor compatibilidad
      res.json({ message: 'Producto eliminado exitosamente.' });
    } else {
      res.status(404).json({ message: 'Producto no encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al eliminar el producto.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};