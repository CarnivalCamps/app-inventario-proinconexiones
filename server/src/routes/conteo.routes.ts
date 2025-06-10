// server/src/routes/conteo.routes.ts

import { Router } from "express";
import { 
    iniciarConteoFisico,
    addDetallesConteoFisico,
    finalizarConteoFisico,
    aplicarAjustesConteoFisico,
    getAllConteos,
    getConteoById // <--- IMPORTA
} from "../controllers/conteo.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";


const router = Router();
const rolesAdminAlmacenista = ['Administrador', 'Almacenista']

// Rutas para Conteos Físicos
router.get('/', checkAuth, getAllConteos); // <--- AÑADE O VERIFICA ESTA LÍNEA
router.get('/:idConteo', checkAuth, getConteoById);

router.post('/', checkAuth, checkRole(rolesAdminAlmacenista), iniciarConteoFisico);
router.post('/:idConteo/detalles', checkAuth, checkRole(rolesAdminAlmacenista), addDetallesConteoFisico);
router.put('/:idConteo/finalizar', checkAuth, checkRole(rolesAdminAlmacenista), finalizarConteoFisico);
router.post('/:idConteo/aplicar-ajustes', checkAuth, checkRole(rolesAdminAlmacenista), aplicarAjustesConteoFisico); // <--- AÑADE ESTA RUTA (POST porque crea movimientos)

export default router;