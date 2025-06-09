// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware para proteger rutas (verificar token)
const protect = async (req, res, next) => {
  let token;

  // Verifica si el token existe en los headers de la solicitud
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrae el token (quita "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verifica el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Encuentra el usuario por el ID en el token y lo adjunta al objeto de solicitud
      req.user = await User.findById(decoded.id).select('-password'); // No queremos la contraseña

      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }

      next(); // Continúa con la siguiente función middleware o controlador de ruta
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token fallido o expirado' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

// Middleware para restringir acceso por rol
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Verifica si el rol del usuario está incluido en los roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };