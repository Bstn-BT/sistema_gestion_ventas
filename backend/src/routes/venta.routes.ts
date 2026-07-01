import { Router } from 'express';
import { obtenerVentas, registrarVenta, obtenerVentaPorId, marcarComoRetirada, retirarMasivo } from '../controllers/venta.controller';

const router = Router();

router.post('/', registrarVenta);
router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);
router.patch('/:id/retirar', marcarComoRetirada);
router.post('/retirar-masivo', retirarMasivo);


export default router;