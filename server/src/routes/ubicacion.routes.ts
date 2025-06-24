// server/src/routes/ubicacion.routes.ts
import { Router } from "express";
import { 
    createUbicacion, 
    getAllUbicaciones,
    getUbicacionById,   // <-- IMPORTA
    getUbicacionesConStock,
    updateUbicacion,    // <-- IMPORTA
    deleteUbicacion,     // <-- IMPORTA
    verificarProductoEnUbicacion
} from "../controllers/ubicacion.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = Router();
const rolesPermitidos = ['Administrador', 'Almacenista'];

router.post('/', checkAuth, checkRole(rolesPermitidos), createUbicacion);
router.get('/', checkAuth, getAllUbicaciones);
router.get('/con-stock', getUbicacionesConStock);
router.get('/:id/productos/:producto_id', verificarProductoEnUbicacion);
router.get('/:id', checkAuth, getUbicacionById);         // <-- AÑADE
router.put('/:id', checkAuth, checkRole(rolesPermitidos), updateUbicacion); // <-- AÑADE
router.delete('/:id', checkAuth, checkRole(rolesPermitidos), deleteUbicacion); // <-- AÑADE

export default router;