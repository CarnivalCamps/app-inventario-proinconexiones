// server/src/routes/unidadMedida.routes.ts

import { Router } from "express";
import {
    getAllUnidadesMedida,
    createUnidadMedida,
    getUnidadMedidaById,
    updateUnidadMedida,
    deleteUnidadMedida
} from "../controllers/unidadMedida.controller";
import { checkAuth } from "../middlewares/auth.middleware";

const router = Router();

// Rutas para Unidades de Medida
router.get('/', getAllUnidadesMedida);
router.get('/:id', getUnidadMedidaById);
router.post('/', checkAuth, createUnidadMedida);
router.put('/:id', checkAuth, updateUnidadMedida);
router.delete('/:id', checkAuth, deleteUnidadMedida);

export default router;