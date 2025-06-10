// server/src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz Request de Express para incluir nuestra propiedad 'user'
export interface AuthRequest extends Request {
    user?: { id: number; nombre_usuario: string; rol: string };
}

export const checkAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. Obtener el token del header de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
        return;
    }

    try {
        // 2. Verificar el token usando la clave secreta
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

        // 3. Añadir el payload decodificado (info del usuario) al objeto request
        req.user = decodedPayload as { id: number; nombre_usuario: string; rol: string };

        // 4. Llamar a next() para pasar al siguiente middleware o al controlador final
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token inválido o expirado.' }); // 403 Forbidden
        return;
    }
};