import { Router } from 'express';
import {
    actualizarEstilo,
    actualizarModificador,
    crearEstilo,
    crearModificador,
    eliminarEstilo,
    eliminarModificador,
    obtenerCatalogos
} from '../controllers/catalogo.controller';

const router = Router();

router.get('/', obtenerCatalogos);

router.post('/estilos', crearEstilo);
router.put('/estilos/:id', actualizarEstilo);
router.delete('/estilos/:id', eliminarEstilo);

router.post('/modificadores', crearModificador);
router.put('/modificadores/:id', actualizarModificador);
router.delete('/modificadores/:id', eliminarModificador);

export default router;
