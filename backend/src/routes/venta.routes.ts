import { Router } from 'express';
import { obtenerVentas, registrarVenta, obtenerVentaPorId } from '../controllers/venta.controller';

const router = Router();

router.post('/', registrarVenta);
router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);

export default router;