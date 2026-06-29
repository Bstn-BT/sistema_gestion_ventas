import { Router } from 'express';
import { crearModificador, obtenerCatalogos } from '../controllers/catalogo.controller';

// Router para manejar las rutas relacionadas con el catálogo
const router = Router(); 

// Ruta para obtener los catálogos de tipo de comisión y modificadores
router.get('/', obtenerCatalogos);

router.post('/modificadores', crearModificador); // Ruta para crear un nuevo modificador

// Exporta el router para que pueda ser usado en otros archivos
export default router; 