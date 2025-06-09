// src/routes/aiChatRoutes.js
const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const { protect } = require('../middlewares/authMiddlewares'); // Necesitamos proteger estas rutas

// @route   GET /api/ai-chat/session
// @desc    Obtener el historial de chat de IA para un usuario
// @access  Private (User)
router.get('/session', protect, aiChatController.getChatSession);

// @route   POST /api/ai-chat/message
// @desc    Enviar un mensaje a la IA y obtener una respuesta
// @access  Private (User)
router.post('/message', protect, aiChatController.sendMessageToAI);

module.exports = router;