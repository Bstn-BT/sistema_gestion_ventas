import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import catalogoRoutes from './routes/catalogo.routes';
import ventaRoutes from './routes/venta.routes';
import dolarRoutes from './routes/dolar.routes';

dotenv.config();

// Manejadores de errores globales: si algo falla silenciosamente,
// ahora se va a imprimir en consola en vez de matar el proceso sin avisar
process.on('uncaughtException', (err) => {
  console.error('=== ERROR NO CAPTURADO ===', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('=== PROMESA RECHAZADA SIN MANEJAR ===', reason);
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/catalogos', catalogoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dolar', dolarRoutes);
app.use('/api/modificadores', catalogoRoutes);

const iniciarServidor = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

iniciarServidor();