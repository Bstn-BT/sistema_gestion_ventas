import { Router } from 'express';
import { obtenerVentas, registrarVenta, obtenerVentaPorId, marcarComoRetirada } from '../controllers/venta.controller';

const router = Router();

router.post('/', registrarVenta);
router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);
router.patch('/:id/retirar', marcarComoRetirada);


export default router;