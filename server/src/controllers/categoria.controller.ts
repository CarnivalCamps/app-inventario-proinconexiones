// server/src/controllers/categoria.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { CategoriaProducto } from "../entities/CategoriaProducto";
import { AuthRequest } from "../middlewares/auth.middleware"; // Si se usa en rutas protegidas

export const getAllCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const categorias = await categoriaRepository.find({
            order: { nombre_categoria: 'ASC' } // Opcional: ordenar alfabéticamente
        });
        res.status(200).json(categorias);
        return;
    } catch (error) {
        console.error("Error en getAllCategorias:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener las categorías.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener las categorías." });
        return;
    }
};

export const createCategoria = async (req: AuthRequest, res: Response): Promise<void> => {
    const { nombre_categoria, descripcion_categoria } = req.body;

    try {
        if (!nombre_categoria) {
            res.status(400).json({ message: "El nombre de la categoría es requerido." });
            return;
        }

        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);

        const categoriaExistente = await categoriaRepository.findOneBy({ nombre_categoria });
        if (categoriaExistente) {
            res.status(409).json({ message: "Ya existe una categoría con ese nombre." });
            return;
        }

        const nuevaCategoria = new CategoriaProducto();
        nuevaCategoria.nombre_categoria = nombre_categoria;
        if (descripcion_categoria !== undefined) { // Para permitir descripciones vacías si se envían
            nuevaCategoria.descripcion_categoria = descripcion_categoria;
        }

        await categoriaRepository.save(nuevaCategoria);
        res.status(201).json(nuevaCategoria);
        return;

    } catch (error) {
        console.error("Error en createCategoria:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al crear la categoría.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al crear la categoría." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const getCategoriaById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const categoria = await categoriaRepository.findOneBy({ id_categoria: parseInt(id) });

        if (!categoria) {
            res.status(404).json({ message: "Categoría no encontrada." });
            return;
        }
        res.status(200).json(categoria);
        return;
    } catch (error) {
        console.error("Error en getCategoriaById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener la categoría.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener la categoría." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const updateCategoria = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre_categoria, descripcion_categoria } = req.body;

    try {
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const categoria = await categoriaRepository.findOneBy({ id_categoria: parseInt(id) });

        if (!categoria) {
            res.status(404).json({ message: "Categoría no encontrada para actualizar." });
            return;
        }

        // Verificar si el nuevo nombre de categoría ya existe en otra categoría
        if (nombre_categoria && nombre_categoria !== categoria.nombre_categoria) {
            const categoriaExistente = await categoriaRepository.findOneBy({ nombre_categoria });
            if (categoriaExistente) {
                res.status(409).json({ message: "Ya existe otra categoría con ese nuevo nombre." });
                return;
            }
            categoria.nombre_categoria = nombre_categoria;
        }

        // Solo actualiza la descripción si se proporciona en el body
        // Si se envía "" (string vacío), se actualiza. Si no se envía, no se toca.
        if (descripcion_categoria !== undefined) {
            categoria.descripcion_categoria = descripcion_categoria;
        }

        await categoriaRepository.save(categoria);
        res.status(200).json(categoria);
        return;

    } catch (error) {
        console.error("Error en updateCategoria:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar la categoría.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar la categoría." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const deleteCategoria = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const categoria = await categoriaRepository.findOneBy({ id_categoria: parseInt(id) });

        if (!categoria) {
            res.status(404).json({ message: "Categoría no encontrada para eliminar." });
            return;
        }

        await categoriaRepository.remove(categoria);
        res.status(204).send(); // 204 No Content
        return;

    } catch (error: any) { // Cambiado a 'any' para acceder a 'error.code' de forma segura
        console.error("Error en deleteCategoria:", error);

        // Verificar si el error es por una restricción de clave foránea (código 23503 en PostgreSQL)
        // o si el mensaje contiene la frase típica de violación de FK.
        if ((error.code === '23503') || (error instanceof Error && error.message.includes('violates foreign key constraint'))) {
             // Mensaje más específico como solicitaste
            res.status(409).json({ message: "No se pueden eliminar categorías con productos asociados." });
            return;
        }

        // Manejo de otros errores
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al eliminar la categoría.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al eliminar la categoría." });
        return;
    }
};