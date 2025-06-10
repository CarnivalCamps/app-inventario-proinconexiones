// server/src/routes/solicitud.routes.ts
import { Router } from "express";
import {
    createSolicitudReserva, getAllSolicitudes, getSolicitudById,
    aprobarSolicitud, rechazarSolicitud, entregarSolicitud
} from "../controllers/solicitud.controller";
import { checkAuth } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware"; // <--- IMPORTA checkRole

const router = Router();

const rolesVendedorAdmin = ['Vendedor', 'Administrador']; // Roles que pueden crear solicitudes
const rolesAlmacenistaAdmin = ['Almacenista', 'Administrador']; // Roles que procesan solicitudes

// Vendedor (o Admin) crea una solicitud
router.post('/', checkAuth, checkRole(rolesVendedorAdmin), createSolicitudReserva);

// Todos los autenticados pueden ver (o podrías restringirlo más)
router.get('/', checkAuth, getAllSolicitudes);
router.get('/:id', checkAuth, getSolicitudById);

// Almacenista (o Admin) procesa
router.put('/:id/aprobar', checkAuth, checkRole(rolesAlmacenistaAdmin), aprobarSolicitud);
router.put('/:id/rechazar', checkAuth, checkRole(rolesAlmacenistaAdmin), rechazarSolicitud);
router.put('/:id/entregar', checkAuth, checkRole(rolesAlmacenistaAdmin), entregarSolicitud);

export default router;