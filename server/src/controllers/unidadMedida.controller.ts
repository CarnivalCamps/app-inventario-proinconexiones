// server/src/controllers/unidadMedida.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { UnidadMedida } from "../entities/UnidadMedida";
import { AuthRequest } from "../middlewares/auth.middleware";
import { FindOptionsWhere, ILike } from "typeorm";


export const getAllUnidadesMedida = async (req: Request, res: Response): Promise<void> => {
    try {
        const unidadRepository = AppDataSource.getRepository(UnidadMedida);
        const unidades = await unidadRepository.find({
            order: { nombre_unidad: 'ASC' }
        });
        res.status(200).json(unidades);
        return;
    } catch (error) {
        console.error("Error en getAllUnidadesMedida:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener las unidades de medida.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener las unidades de medida." });
        return;
    }
};

export const createUnidadMedida = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nombre_unidad, abreviatura } = req.body;

    try {
        if (!nombre_unidad || !abreviatura) {
            res.status(400).json({ message: "El nombre de la unidad y la abreviatura son requeridos." });
            return;
        }

        const unidadRepository = AppDataSource.getRepository(UnidadMedida);

        // Verificar si ya existe una unidad con ese nombre o abreviatura
        const existePorNombre = await unidadRepository.findOneBy({ nombre_unidad });
        if (existePorNombre) {
            res.status(409).json({ message: "Ya existe una unidad de medida con ese nombre." });
            return;
        }
        const existePorAbreviatura = await unidadRepository.findOneBy({ abreviatura });
        if (existePorAbreviatura) {
            res.status(409).json({ message: "Ya existe una unidad de medida con esa abreviatura." });
            return;
        }

        const nuevaUnidad = unidadRepository.create({ nombre_unidad, abreviatura });
        await unidadRepository.save(nuevaUnidad);
        res.status(201).json(nuevaUnidad);
        return;

    } catch (error) {
        console.error("Error en createUnidadMedida:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al crear la unidad de medida.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al crear la unidad de medida." });
        return;
    }
};

export const getUnidadMedidaById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const unidadRepository = AppDataSource.getRepository(UnidadMedida);
        const unidad = await unidadRepository.findOneBy({ id_unidad_medida: parseInt(id) });

        if (!unidad) {
            res.status(404).json({ message: "Unidad de medida no encontrada." });
            return;
        }
        res.status(200).json(unidad);
        return;
    } catch (error) {
        console.error("Error en getUnidadMedidaById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener la unidad de medida.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener la unidad de medida." });
        return;
    }
};

export const updateUnidadMedida = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre_unidad, abreviatura } = req.body;

    try {
        const unidadRepository = AppDataSource.getRepository(UnidadMedida);
        let unidad = await unidadRepository.findOneBy({ id_unidad_medida: parseInt(id) });

        if (!unidad) {
            res.status(404).json({ message: "Unidad de medida no encontrada para actualizar." });
            return;
        }

        // Verificar conflictos si se cambia el nombre o la abreviatura
        if (nombre_unidad && nombre_unidad !== unidad.nombre_unidad) {
            const existePorNombre = await unidadRepository.findOneBy({ nombre_unidad });
            if (existePorNombre) {
                res.status(409).json({ message: "Ya existe otra unidad de medida con ese nombre." });
                return;
            }
            unidad.nombre_unidad = nombre_unidad;
        }

        if (abreviatura && abreviatura !== unidad.abreviatura) {
            const existePorAbreviatura = await unidadRepository.findOneBy({ abreviatura });
            if (existePorAbreviatura) {
                res.status(409).json({ message: "Ya existe otra unidad de medida con esa abreviatura." });
                return;
            }
            unidad.abreviatura = abreviatura;
        }
        
        // Aplicar cambios solo si se proporcionaron (para permitir actualizaciones parciales)
        if (nombre_unidad !== undefined) unidad.nombre_unidad = nombre_unidad;
        if (abreviatura !== undefined) unidad.abreviatura = abreviatura;


        await unidadRepository.save(unidad);
        res.status(200).json(unidad);
        return;

    } catch (error) {
        console.error("Error en updateUnidadMedida:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar la unidad de medida.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar la unidad de medida." });
        return;
    }
};

export const deleteUnidadMedida = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const unidadRepository = AppDataSource.getRepository(UnidadMedida);
        const unidad = await unidadRepository.findOneBy({ id_unidad_medida: parseInt(id) });

        if (!unidad) {
            res.status(404).json({ message: "Unidad de medida no encontrada para eliminar." });
            return;
        }

        // Considerar la lógica de negocio: ¿qué pasa si esta unidad está en uso por algún producto?
        // Por ahora, la eliminaremos. En un sistema real, se impediría o se manejaría de otra forma.

        await unidadRepository.remove(unidad);
        res.status(204).send(); // 204 No Content
        return;

    } catch (error) {
        console.error("Error en deleteUnidadMedida:", error);
        // Podrías verificar si el error es por una restricción de clave foránea
        // Por ejemplo, si la unidad está siendo usada por productos
        if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
             res.status(409).json({ message: "No se puede eliminar la unidad de medida porque está en uso.", error: error.message });
             return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al eliminar la unidad de medida.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al eliminar la unidad de medida." });
        return;
    }
};