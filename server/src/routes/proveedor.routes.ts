// server/src/routes/proveedor.routes.ts

import { Router } from "express";
import {
    getAllProveedores,
    createProveedor,
    getProveedorById,
    updateProveedor,
    deleteProveedor
} from "../controllers/proveedor.controller";
import { checkAuth } from "../middlewares/auth.middleware";

const router = Router();

// Rutas para Proveedores
router.get('/', getAllProveedores); // Podría ser checkAuth si solo usuarios logueados pueden ver proveedores
router.get('/:id', getProveedorById); // Idem
router.post('/', checkAuth, createProveedor);
router.put('/:id', checkAuth, updateProveedor);
router.delete('/:id', checkAuth, deleteProveedor);

export default router;