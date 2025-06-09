// src/controllers/chatController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Inicializa el modelo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Puedes elegir 'gemini-pro' o 'gemini-1.5-flash' si es más adecuado

// @desc    Enviar mensaje al bot de chat y obtener respuesta de Gemini
// @route   POST /api/chat/message
// @access  Private/User
const sendMessageToBot = async (req, res) => {
  const { message } = req.body; // El mensaje que envía el usuario
  const userId = req.user._id; // El ID del usuario que viene del middleware de autenticación

  if (!message) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 1. Obtener el historial de chat del usuario
    // Limita el historial para no exceder el límite de tokens de Gemini
    const recentChatHistory = user.chatHistory.slice(-10); // Últimos 10 mensajes (ajusta si es necesario)

    // 2. Obtener la información del inventario de productos
    const products = await Product.find({});
    let productInfo = "No hay productos disponibles en este momento.";
    if (products.length > 0) {
        productInfo = "Productos disponibles en el Mercado Felino:\n";
        products.forEach(p => {
            productInfo += `- <span class="math-inline">\{p\.name\} \(</span>{p.description}), Precio: $${p.price.toFixed(2)}, Stock: ${p.stock}\n`;
        });
    }

    // 3. Construir el prompt para Gemini
    const chat = model.startChat({
      history: recentChatHistory.map(entry => ({
        role: entry.sender === 'user' ? 'user' : 'model', // Gemini usa 'user' y 'model'
        parts: [{ text: entry.message }],
      })),
      generationConfig: {
        maxOutputTokens: 200, // Limita la longitud de la respuesta del bot
      },
    });

    // Prompt del sistema/rol del bot
    const systemPrompt = `Eres un asistente amigable y experto en el 'Mercado Felino'. Tu objetivo es ayudar a los usuarios a encontrar productos para gatos, responder preguntas sobre ellos, dar información sobre su disponibilidad y guiar su compra. Si el usuario te pregunta por productos, refiérete a la lista de productos que te proporciono. Si no tienes información sobre un producto específico, di que no lo conoces. No respondas preguntas que no estén relacionadas con productos para gatos o el mercado felino.

    ${productInfo}

    Usuario: ${message}`; // Aquí integramos el mensaje actual del usuario

    // Envía el mensaje y el contexto a Gemini
    const result = await chat.sendMessage(systemPrompt);
    const response = await result.response;
    const botResponse = response.text();

    // 4. Guardar el nuevo mensaje del usuario y la respuesta del bot en el historial del usuario
    user.chatHistory.push({ sender: 'user', message });
    user.chatHistory.push({ sender: 'bot', message: botResponse });

    // Limita el historial guardado para no crecer indefinidamente (opcional, pero recomendado)
    if (user.chatHistory.length > 50) { // Guarda solo los últimos 50 mensajes
        user.chatHistory = user.chatHistory.slice(-50);
    }

    await user.save();

    res.json({ botResponse });

  } catch (error) {
    console.error('Error al comunicarse con Gemini o guardar chat:', error);
    res.status(500).json({ message: 'Error del servidor al procesar el mensaje del chat.' });
  }
};

// @desc    Obtener el historial de chat de un usuario
// @route   GET /api/chat/history
// @access  Private/User
const getChatHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(user.chatHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor al obtener el historial de chat.' });
  }
};

module.exports = {
  sendMessageToBot,
  getChatHistory,
};