import express from 'express'; // Framework para crear el servidor y manejar rutas
import cors from 'cors'; // Middleware para permitir solicitudes desde otros dominios
import dotenv from 'dotenv'; // Carga variables de entorno

import { connectDB } from './config/database'; // Conexion a la base de datos
import catalogoRoutes from './routes/catalogo.routes';
import ventaRoutes from './routes/venta.routes';
import dolarRoutes from './routes/dolar.routes';

// Carga las variables del .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/catalogos', catalogoRoutes); // Ruta para manejar los catálogos
app.use('/api/ventas', ventaRoutes); // Ruta para manejar las ventas
app.use('/api/dolar', dolarRoutes); // Ruta para obtener el valor del dólar

// Inicia la Base de Datos y LUEGO el servidor
const iniciarServidor = async () => {
  // Intenta conectar a la base de datos antes de levantar el servidor
  await connectDB();
  
  // Si conecta bien, se levanta la API para escuchar a React
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

iniciarServidor();