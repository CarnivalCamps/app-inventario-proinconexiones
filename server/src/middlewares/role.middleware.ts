// server/src/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Asumiendo que el rol está en req.user (viene del middleware checkAuth)
      const userRole = (req as any).user?.rol;
      
      // 🔍 DEBUG: Agregar logs temporales
      console.log('=== DEBUG ROLE MIDDLEWARE ===');
      console.log('User object:', (req as any).user);
      console.log('User role:', userRole);
      console.log('Allowed roles:', allowedRoles);
      console.log('Role match:', allowedRoles.includes(userRole));
      console.log('===============================');
      
      if (!userRole) {
        console.log('❌ No role found in user object');
        res.status(403).json({ 
          message: 'No role found',
          debug: {
            user: (req as any).user,
            allowedRoles: allowedRoles
          }
        });
        return;
      }
      
      if (!allowedRoles.includes(userRole)) {
        console.log('❌ Role not allowed');
        res.status(403).json({ 
          message: 'Insufficient permissions',
          debug: {
            userRole: userRole,
            allowedRoles: allowedRoles,
            user: (req as any).user
          }
        });
        return;
      }
      
      console.log('✅ Role check passed');
      next();
    } catch (error) {
      console.log('❌ Error in role middleware:', error);
      res.status(500).json({ message: 'Server error', error: error });
    }
  };
};