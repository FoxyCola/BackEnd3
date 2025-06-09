// src/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController'); // Importa los controladores

const router = express.Router(); // Crea un nuevo router de Express

// Rutas de autenticación
router.post('/register', registerUser); // Ruta para registrar un nuevo usuario
router.post('/login', loginUser);       // Ruta para iniciar sesión

module.exports = router;