import { Router } from 'express';
import {
    actualizarVenta,
    eliminarVenta,
    obtenerVentas,
    registrarVenta,
    obtenerVentaPorId,
    marcarComoRetirada,
    retirarMasivo,
    obtenerModificadoresMasSolicitados
} from '../controllers/venta.controller';

const router = Router();

router.post('/', registrarVenta);
router.get('/', obtenerVentas);
router.post('/retirar-masivo', retirarMasivo);
router.get('/estadisticas/modificadores', obtenerModificadoresMasSolicitados);
router.get('/:id', obtenerVentaPorId);
router.put('/:id', actualizarVenta);
router.delete('/:id', eliminarVenta);
router.patch('/:id/retirar', marcarComoRetirada);


export default router;
