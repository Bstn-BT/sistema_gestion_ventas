import { Router } from 'express';
import { obtenerVentas, registrarVenta } from '../controllers/venta.controller';

const router = Router();

// Ruta para recibir los datos del formulario (POST)
router.post('/', registrarVenta);

// Ruta para obtener el historial de ventas (GET)
router.get('/', obtenerVentas);

export default router;