import { Router } from "express";
import { getStockByUbicacion } from "../controllers/stock.controller";
import { checkAuth } from "../middlewares/auth.middleware";

const router = Router();
router.get('/por-ubicacion', checkAuth, getStockByUbicacion);
export default router;