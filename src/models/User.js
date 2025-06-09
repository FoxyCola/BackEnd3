// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true // Elimina espacios en blanco al inicio/final
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Solo permite 'user' o 'admin'
    default: 'user'
  },
  chatHistory: [ // Historial de chat integrado
    {
      sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Nuevo campo para el carrito
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Referencia al modelo Product
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1, // La cantidad mínima es 1
        default: 1
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware de Mongoose para hashear la contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next(); // Si la contraseña no ha sido modificada, no la hasheamos de nuevo
  }
  const salt = await bcrypt.genSalt(10); // Genera un salt (cadena aleatoria)
  this.password = await bcrypt.hash(this.password, salt); // Hashea la contraseña
  next();
});

// Método para comparar contraseñas (usado en el login)
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);