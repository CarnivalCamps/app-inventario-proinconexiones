// server/src/routes/auth.routes.ts

import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { checkAuth, AuthRequest } from "../middlewares/auth.middleware"; // <--- 1. IMPORTA checkAuth y AuthRequest

const router = Router();

// Rutas públicas (no necesitan token)
router.post('/register', register);
router.post('/login', login);

// Ruta protegida (necesita token)
// El middleware `checkAuth` se ejecuta ANTES que el controlador de la ruta
router.get('/profile', checkAuth, (req: AuthRequest, res) => { // <--- 2. AÑADE ESTA RUTA
    // Gracias a checkAuth, ahora tenemos acceso a req.user
    res.json({
        message: "Acceso concedido a la ruta de perfil.",
        user: req.user
    });
});

export default router;