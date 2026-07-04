import { Router } from 'express';
import { obtenerVentas, registrarVenta, obtenerVentaPorId, marcarComoRetirada, retirarMasivo, obtenerModificadoresMasSolicitados } from '../controllers/venta.controller';

const router = Router();

router.post('/', registrarVenta);
router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);
router.patch('/:id/retirar', marcarComoRetirada);
router.post('/retirar-masivo', retirarMasivo);
router.get('/estadisticas/modificadores', obtenerModificadoresMasSolicitados);


export default router;