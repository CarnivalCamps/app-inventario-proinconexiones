// server/src/routes/producto.routes.ts
import { Router } from "express";
import {
    getAllProductos,
    createProducto,
    getProductoById,
    updateProducto,
    deleteProducto,
    searchProductos,
    getUbicacionesByProductoId,
    updateProductoUbicaciones,
} from "../controllers/producto.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = Router();
const rolesAdminAlmacenista = ['Administrador', 'Almacenista'];

router.get('/', getAllProductos);
router.get('/search/term', checkAuth, searchProductos); // Mover antes de /:id
router.get('/:id', getProductoById);
router.get('/:id/ubicaciones', getUbicacionesByProductoId);
router.put('/:id/ubicaciones', checkAuth, updateProductoUbicaciones); // Corregido

router.post('/', checkAuth, checkRole(rolesAdminAlmacenista), createProducto);
router.put('/:id', checkAuth, checkRole(rolesAdminAlmacenista), updateProducto);
router.delete('/:id', checkAuth, checkRole(rolesAdminAlmacenista), deleteProducto);

export default router;