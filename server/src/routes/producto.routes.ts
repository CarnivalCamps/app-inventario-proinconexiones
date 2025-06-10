// server/src/routes/producto.routes.ts

import { Router } from "express";
import {
    getAllProductos,
    createProducto,
    getProductoById,
    updateProducto,
    deleteProducto
    // Aquí añadiremos getProductoById, updateProducto, deleteProducto
} from "../controllers/producto.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = Router();
const rolesAdminAlmacenista = ['Administrador', 'Almacenista'];

router.get('/', getAllProductos); // Podría ser checkAuth si quieres que solo usuarios logueados vean
router.get('/:id', getProductoById); // Idem

router.post('/', checkAuth, checkRole(rolesAdminAlmacenista), createProducto);
router.put('/:id', checkAuth, checkRole(rolesAdminAlmacenista), updateProducto);
router.delete('/:id', checkAuth, checkRole(rolesAdminAlmacenista), deleteProducto);




export default router;