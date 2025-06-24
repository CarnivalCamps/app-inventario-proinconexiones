import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { StockProducto } from "../entities/StockProducto";

export const getStockByUbicacion = async (req: Request, res: Response): Promise<void> => {
    const { id_ubicacion } = req.query;
    if (!id_ubicacion) {
        res.status(400).json({ message: "Se requiere un 'id_ubicacion'." });
        return;
    }
    try {
        const stockRepo = AppDataSource.getRepository(StockProducto);
        const stock = await stockRepo.find({
            where: { id_ubicacion_fk: Number(id_ubicacion) },
            relations: ["producto", "producto.unidad_medida_primaria"]
        });
        res.status(200).json(stock);
    } catch (error) { /* ... manejo de errores ... */ }
};