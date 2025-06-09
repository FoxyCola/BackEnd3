// src/controllers/aiChatController.js
const AIChatSession = require('../models/AIChatSession');
const Product = require('../models/Product');
const User = require('../models/User'); // <--- ¡NUEVA LÍNEA: ASEGÚRATE DE QUE ESTÉ PRESENTE!
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Obtener la clave API de Gemini desde las variables de entorno
const API_KEY = process.env.GEMINI_API_KEY;

// Inicializa la IA de Google Gemini
// Usamos un modelo más fiable como 'gemini-1.5-flash'
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Define las herramientas (funciones que Gemini puede "llamar")
const tools = [
    {
        functionDeclarations: [
            {
                name: "getProductsFromDatabase",
                description: "Obtiene una lista de productos disponibles en la tienda. Puede filtrar por nombre, descripción o categoría si se especifica.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: {
                            type: "STRING",
                            description: "Palabra clave para buscar productos por nombre, descripción o categoría. Por ejemplo: 'electrónica', 'teléfono', 'camiseta'."
                        }
                    },
                    required: [] // 'query' no es estrictamente requerido, si es vacío, trae todos.
                }
            }
        ]
    }
];

// Implementación de la función que Gemini puede llamar
async function getProductsFromDatabase(query) {
    try {
        let products;
        if (query) {
            // Búsqueda insensible a mayúsculas/minúsculas en nombre, descripción o categoría
            const searchRegex = new RegExp(query, 'i');
            products = await Product.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex } // Asumiendo que Product tiene una categoría
                ]
            });
        } else {
            products = await Product.find({}); // Si no hay query, trae todos los productos
        }

        // AGREGAR console.log AQUÍ para depuración
        console.log('Productos encontrados en la DB:', products);


        if (products.length === 0) {
            return "No se encontraron productos con la consulta: " + query;
        }

        // Formatea los productos para una respuesta concisa que Gemini pueda procesar
        const formattedProducts = products.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            description: p.description
        }));

        // Gemini prefiere strings para el output de funciones.
        return JSON.stringify(formattedProducts);

    } catch (error) {
        console.error('Error al obtener productos de la base de datos para la IA:', error);
        return `Error al obtener productos: ${error.message}`;
    }
}


// @desc    Obtener el historial de chat de IA para un usuario
// @route   GET /api/ai-chat/session
// @access  Private (User)
exports.getChatSession = async (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado

    try {
        let session = await AIChatSession.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId, history: [] } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ history: session.history });
    } catch (error) {
        console.error('Error al obtener/crear sesión de chat de IA:', error);
        res.status(500).json({ message: 'Error al obtener la sesión de chat de IA.' });
    }
};

// @desc    Enviar un mensaje a la IA y obtener una respuesta
// @route   POST /api/ai-chat/message
// @access  Private (User)
exports.sendMessageToAI = async (req, res) => {
    const userId = req.user.id;
    const userMessageText = req.body.messageText;

    try {
        // Obtener o crear la sesión de chat (con el historial)
        let session = await AIChatSession.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId, history: [] } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // --- ¡NUEVO CÓDIGO AQUÍ: Obtener el nombre del usuario! ---
        const user = await User.findById(userId);
        // Asume que el nombre del usuario está en 'username' o 'name'
        const userName = user ? user.username : 'Usuario Desconocido'; // O user.name si lo tienes así

        // Preparamos el historial que se enviará a Gemini.
        // Le añadimos un mensaje de contexto al principio sobre el nombre del usuario.
        // Esto es crucial para que la IA sepa con quién está hablando.
        let conversationHistoryWithContext = [];

        // Mensaje de contexto para la IA sobre el nombre del usuario
        // Lo ponemos como 'user' y luego una 'model' respuesta simulada para que sea un par válido
        // en el historial de Gemini. Esto actúa como una "instrucción del sistema" para Gemini.
        conversationHistoryWithContext.push({
            role: "user",
            parts: [{ text: `(Contexto para ti, tu nombre es Cat. El nombre del usuario con el que estás conversando es ${userName}. Tenlo muy en cuenta en tus respuestas para personalizar la conversación y no olvides sostener una actitud como un felino)` }]
        });
        conversationHistoryWithContext.push({
            role: "model",
            parts: [{ text: `(Entendido. Me referiré al usuario como ${userName} si es apropiado. ¿En qué puedo ayudarte, ${userName}?)` }]
        });

        // Concatenamos el historial real de la sesión después de los mensajes de contexto
        conversationHistoryWithContext = conversationHistoryWithContext.concat(session.history);


        // Crear un nuevo chat con el historial MODIFICADO (incluyendo el contexto del nombre) y las herramientas
        const chat = model.startChat({
            history: conversationHistoryWithContext, // <--- Pasamos el historial con el contexto del nombre
            tools: tools,
        });

        // Envía el mensaje del usuario
        const result = await chat.sendMessage(userMessageText);

        let botReply = '';
        let functionCallResponse = null;

        // Manejar las partes de la respuesta (texto o llamadas a funciones)
        for (const part of result.response.candidates[0].content.parts) {
            if (part.text) {
                botReply += part.text;
            } else if (part.functionCall) {
                const functionName = part.functionCall.name;
                const functionArgs = part.functionCall.args;

                console.log(`AI llamó a la función: ${functionName} con argumentos:`, functionArgs);

                if (functionName === "getProductsFromDatabase") {
                    functionCallResponse = await getProductsFromDatabase(functionArgs.query);
                }
            }
        }

        // Si hubo una llamada a función, envía la respuesta de la función a Gemini para que la interprete
        if (functionCallResponse) {
            console.log('Enviando respuesta de la función a Gemini:', functionCallResponse);
            const toolResponse = await chat.sendMessage({
                functionResponse: {
                    name: "getProductsFromDatabase",
                    response: {
                        content: functionCallResponse
                    }
                }
            });
            botReply = toolResponse.response.candidates[0].content.parts[0].text;
        }

        // IMPORTANTE: Solo guardamos el historial real de la conversación (sin los mensajes de contexto
        // que inyectamos al principio de forma dinámica para Gemini).
        session.history.push({ role: "user", parts: [{ text: userMessageText }] });
        session.history.push({ role: "model", parts: [{ text: botReply }] });

        await session.save(); // Guarda los cambios en la sesión de chat

        res.json({ reply: botReply });

    } catch (error) {
        console.error('Error al enviar mensaje a la IA:', error);
        if (error.message.includes('[GoogleGenerativeAI Error]')) {
             res.status(500).json({ message: `Error de la IA: ${error.message}.` });
        } else {
             res.status(500).json({ message: 'Error interno del servidor al procesar el mensaje de IA.' });
        }
    }
};