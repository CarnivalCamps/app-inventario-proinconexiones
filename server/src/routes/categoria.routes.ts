// server/src/routes/categoria.routes.ts
import { Router } from "express";
import {
    getAllCategorias, createCategoria, getCategoriaById,
    updateCategoria, deleteCategoria
} from "../controllers/categoria.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware"; // <--- IMPORTA checkRole

const router = Router();

const rolesAdminAlmacenista = ['Administrador', 'Almacenista'];

router.get('/', getAllCategorias); // Podría ser checkAuth si quieres que solo usuarios logueados vean
router.get('/:id', getCategoriaById); // Idem

router.post('/', checkAuth, checkRole(rolesAdminAlmacenista), createCategoria);
router.put('/:id', checkAuth, checkRole(rolesAdminAlmacenista), updateCategoria);
router.delete('/:id', checkAuth, checkRole(rolesAdminAlmacenista), deleteCategoria);

export default router;