// src/controllers/authController.js
const User = require('../models/User'); // Importa el modelo de Usuario
const jwt = require('jsonwebtoken');     // Para crear JWTs
require('dotenv').config();              // Para acceder a JWT_SECRET

// Función para generar un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // El token expira en 1 hora
  });
};

// @desc    Registrar un nuevo usuario/administrador
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  // Validación básica
  if (!username || !password) {
    return res.status(400).json({ message: 'Por favor, introduce un nombre de usuario y una contraseña.' });
  }

  try {
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      password, // La contraseña se hashea automáticamente por el middleware en el modelo User
      role: role || 'user', // Si no se especifica, por defecto es 'user'
    });

    // Si el usuario se creó correctamente, devuelve el token y los datos del usuario (sin contraseña)
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al registrar el usuario.' });
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Validación básica
  if (!username || !password) {
    return res.status(400).json({ message: 'Por favor, introduce un nombre de usuario y una contraseña.' });
  }

  try {
    // Buscar el usuario por nombre de usuario
    const user = await User.findOne({ username });

    // Si el usuario existe y la contraseña coincide
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Nombre de usuario o contraseña incorrectos.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al iniciar sesión.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};