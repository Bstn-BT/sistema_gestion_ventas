import { Router } from 'express';
import { obtenerDolarPayPal } from '../controllers/dolar.controller';

const router = Router();

// Ruta para leer el valor del dólar (GET)
router.get('/', obtenerDolarPayPal);

export default router;