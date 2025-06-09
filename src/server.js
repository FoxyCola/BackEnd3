// src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Importa la función de conexión a DB

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');//order routes
const aiChatRoutes = require('./routes/aiChatRoutes');
// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(express.json()); // Permite que el servidor entienda JSON en las solicitudes
// Cors
app.use(cors({
    origin: process.env.FRONTEND_URL, // Permite solo solicitudes desde la URL de tu frontend en Vercel
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    credentials: true // Permite el envío de cookies/encabezados de autorización si es necesario
}));


// Ruta de prueba (para verificar que el servidor está funcionando)
app.get('/', (req, res) => {
  res.send('API del Mercado Felino está en funcionamiento...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Usar las rutas de productos
app.use('/api/cart', cartRoutes);  // Usar las rutas del carrito
app.use('/api/orders', orderRoutes);
app.use('/api/ai-chat', aiChatRoutes); //ia


// Definir el puerto
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));