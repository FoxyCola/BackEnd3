// src/config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Carga las variables de entorno

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Conectado...');
  } catch (err) {
    console.error('Error al conectar MongoDB:', err.message);
    // Salir del proceso con fallo
    process.exit(1);
  }
};

module.exports = connectDB;

//require('dotenv').config(): Carga las variables de entorno definidas en .env
//mongoose.connect(): Intenta conectar a MongoDB usando la URI de tu .env
//console.error mensaje de error si hay algun fallo