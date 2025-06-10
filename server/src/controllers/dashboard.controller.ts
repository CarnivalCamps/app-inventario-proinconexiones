// server/src/controllers/dashboard.controller.ts

import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Producto } from "../entities/Producto";
import { SolicitudReserva } from "../entities/SolicitudReserva";
import { ConteoFisico } from "../entities/ConteoFisico";
import { AuthRequest } from "../middlewares/auth.middleware";
import { LessThanOrEqual, Raw, In } from "typeorm"; // Importar operadores

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const productoRepo = AppDataSource.getRepository(Producto);
        const solicitudRepo = AppDataSource.getRepository(SolicitudReserva);
        const conteoRepo = AppDataSource.getRepository(ConteoFisico);

        // 1. Obtener productos con stock bajo o igual al mínimo (y donde el mínimo sea > 0)
        const productosConStockBajo = await productoRepo.find({
            where: {
                stock_minimo: Raw(alias => `${alias} > 0`), // Raw para comparar con 0
                stock_actual: Raw(alias => `${alias} <= "stock_minimo"`) // Raw para comparar dos columnas
            },
            relations: ["unidad_medida_primaria"] // Cargar la unidad para mostrarla
        });

        // 2. Contar solicitudes de reserva pendientes de aprobación
        const conteoPendientesAprobacion = await solicitudRepo.count({
            where: { estado_solicitud: 'Pendiente' }
        });

        // 3. Contar conteos físicos en progreso
        const conteoConteosEnProgreso = await conteoRepo.count({
            where: { estado_conteo: In(['Iniciado', 'En Progreso']) }
        });

        // 4. Construir el objeto de respuesta
        const summary = {
            productosConStockBajo: productosConStockBajo,
            conteoProductosStockBajo: productosConStockBajo.length,
            conteoPendientesAprobacion: conteoPendientesAprobacion,
            conteoConteosEnProgreso: conteoConteosEnProgreso
        };

        res.status(200).json(summary);
        return;

    } catch (error) {
        console.error("Error en getDashboardSummary:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener el resumen del dashboard.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener el resumen del dashboard." });
        return;
    }
};
