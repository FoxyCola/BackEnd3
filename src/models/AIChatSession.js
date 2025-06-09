// src/models/AIChatSession.js
const mongoose = require('mongoose');

// Esquema para un mensaje individual en la conversación
// Sigue el formato que espera la API de Gemini para el historial
const messageSchema = new mongoose.Schema({
  role: {
    type: String, // 'user' o 'model'
    required: true,
    enum: ['user', 'model'],
  },
  parts: [
    {
      text: {
        type: String,
        required: true,
      },
    },
  ],
  // ELIMINA la línea 'timestamp'
  // timestamp: { // <-- ELIMINAR ESTA SECCIÓN
  //   type: Date,
  //   default: Date.now,
  // },
}, { _id: false }); // No queremos IDs automáticos para subdocumentos si no son necesarios

// ... (el resto del código de AIChatSession.js permanece igual) ...

// Asegúrate de que el schema principal también esté limpio de timestamps automáticos para 'history'
// Los 'timestamps: true' en el schema principal son para createdAt y updatedAt de la *sesión*, no de cada mensaje individual.
const aiChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    history: {
        type: [messageSchema], // Array de mensajes
        default: [],
    },
    // Estos son los timestamps de la sesión completa, no de los mensajes individuales
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Actualizar `updatedAt` en cada guardado
aiChatSessionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const AIChatSession = mongoose.model('AIChatSession', aiChatSessionSchema);

module.exports = AIChatSession;