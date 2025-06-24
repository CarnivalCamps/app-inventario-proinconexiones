// server/src/routes/ordenCompra.routes.ts

import { Router } from "express";
import {
    createOrdenCompra,
    getAllOrdenesCompra,
    getOrdenCompraById,      // <--- IMPORTA
    updateOrdenCompraEstado,  // <--- IMPORTA
    registrarRecepcion 
} from "../controllers/ordenCompra.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = Router();
const rolesPermitidos = ['Administrador', 'Almacenista'];

// Rutas para Órdenes de Compra
router.post('/', checkAuth, checkRole(rolesPermitidos), createOrdenCompra);
router.get('/', checkAuth, getAllOrdenesCompra);
router.get('/:id', checkAuth, getOrdenCompraById);  // <--- AÑADE ESTA RUTA
router.put('/:id/estado', checkAuth, checkRole(rolesPermitidos), updateOrdenCompraEstado); // <--- AÑADE ESTA RUTA
router.post('/:id/recepcion', checkAuth, checkRole(rolesPermitidos), registrarRecepcion);

export default router;