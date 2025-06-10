// server/src/routes/dashboard.routes.ts

import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller";
import { checkAuth } from "../middlewares/auth.middleware";

const router = Router();

// Ruta para obtener el resumen de datos para el dashboard
router.get('/summary', checkAuth, getDashboardSummary);

export default router;