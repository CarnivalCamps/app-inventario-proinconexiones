// server/src/routes/movimiento.routes.ts

import { Router } from "express";
import { registrarEntrada, registrarSalidaBaja, getAllMovimientos } from "../controllers/movimiento.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";

const router = Router();
const rolesAdminAlmacenista = ['Administrador' , 'Almcenista'];
router.get('/', checkAuth, getAllMovimientos);
// Rutas para Movimientos de Inventario
router.post('/entradas', checkAuth, checkRole(rolesAdminAlmacenista), registrarEntrada);
router.post('/salidas-bajas', checkAuth, checkRole(rolesAdminAlmacenista), registrarSalidaBaja);
// Aquí añadiremos más adelante la ruta para salidas/bajas

export default router;