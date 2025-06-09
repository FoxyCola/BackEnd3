// src/routes/chatRoutes.js
const express = require('express');
const { sendMessageToBot, getChatHistory } = require('../controllers/chatController');
const { protect, authorizeRoles } = require('../middlewares/authMiddlewares'); // Necesitamos proteger estas rutas

const router = express.Router();

// Rutas protegidas para usuarios normales para interactuar con el bot
router.post('/message', protect, authorizeRoles('user'), sendMessageToBot);
router.get('/history', protect, authorizeRoles('user'), getChatHistory);

module.exports = router;