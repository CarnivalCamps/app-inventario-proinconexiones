// server/src/controllers/proveedor.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Proveedor } from "../entities/Proveedor";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ILike } from "typeorm"; // Para búsquedas case-insensitive

export const getAllProveedores = async (req: Request, res: Response): Promise<void> => {
    try {
        const proveedorRepository = AppDataSource.getRepository(Proveedor);
        const proveedores = await proveedorRepository.find({
            order: { nombre_proveedor: 'ASC' }
        });
        res.status(200).json(proveedores);
        return;
    } catch (error) {
        console.error("Error en getAllProveedores:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener los proveedores.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener los proveedores." });
        return;
    }
};

export const createProveedor = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        nombre_proveedor,
        contacto_nombre,
        contacto_email,
        contacto_telefono,
        direccion,
        notas
    } = req.body;

    try {
        if (!nombre_proveedor) {
            res.status(400).json({ message: "El nombre del proveedor es requerido." });
            return;
        }

        const proveedorRepository = AppDataSource.getRepository(Proveedor);

        const existePorNombre = await proveedorRepository.findOneBy({ nombre_proveedor: ILike(nombre_proveedor) });
        if (existePorNombre) {
            res.status(409).json({ message: "Ya existe un proveedor con ese nombre." });
            return;
        }

        if (contacto_email) {
            const existePorEmail = await proveedorRepository.findOneBy({ contacto_email: ILike(contacto_email) });
            if (existePorEmail) {
                res.status(409).json({ message: "Ya existe un proveedor con ese email de contacto." });
                return;
            }
        }

        const nuevoProveedor = proveedorRepository.create({
            nombre_proveedor,
            contacto_nombre,
            contacto_email,
            contacto_telefono,
            direccion,
            notas
        });
        await proveedorRepository.save(nuevoProveedor);
        res.status(201).json(nuevoProveedor);
        return;

    } catch (error) {
        console.error("Error en createProveedor:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al crear el proveedor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al crear el proveedor." });
        return;
    }
};

export const getProveedorById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const proveedorRepository = AppDataSource.getRepository(Proveedor);
        const proveedor = await proveedorRepository.findOneBy({ id_proveedor: parseInt(id) });

        if (!proveedor) {
            res.status(404).json({ message: "Proveedor no encontrado." });
            return;
        }
        res.status(200).json(proveedor);
        return;
    } catch (error) {
        console.error("Error en getProveedorById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener el proveedor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener el proveedor." });
        return;
    }
};

export const updateProveedor = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        nombre_proveedor,
        contacto_nombre,
        contacto_email,
        contacto_telefono,
        direccion,
        notas
    } = req.body;

    try {
        const proveedorRepository = AppDataSource.getRepository(Proveedor);
        let proveedor = await proveedorRepository.findOneBy({ id_proveedor: parseInt(id) });

        if (!proveedor) {
            res.status(404).json({ message: "Proveedor no encontrado para actualizar." });
            return;
        }

        if (nombre_proveedor && nombre_proveedor !== proveedor.nombre_proveedor) {
            const existePorNombre = await proveedorRepository.findOneBy({ 
                nombre_proveedor: ILike(nombre_proveedor)
            });
            // Nos aseguramos de que no sea el mismo proveedor que estamos actualizando
            if (existePorNombre && existePorNombre.id_proveedor !== proveedor.id_proveedor) {
                res.status(409).json({ message: "Ya existe otro proveedor con ese nombre." });
                return;
            }
        }

        if (contacto_email && contacto_email !== proveedor.contacto_email) {
            const existePorEmail = await proveedorRepository.findOneBy({ 
                contacto_email: ILike(contacto_email)
            });
            // Nos aseguramos de que no sea el mismo proveedor
            if (existePorEmail && existePorEmail.id_proveedor !== proveedor.id_proveedor) {
                res.status(409).json({ message: "Ya existe otro proveedor con ese email de contacto." });
                return;
            }
        }

        // Actualizar campos si se proporcionan
        proveedor.nombre_proveedor = nombre_proveedor !== undefined ? nombre_proveedor : proveedor.nombre_proveedor;
        proveedor.contacto_nombre = contacto_nombre !== undefined ? contacto_nombre : proveedor.contacto_nombre;
        proveedor.contacto_email = contacto_email !== undefined ? contacto_email : proveedor.contacto_email;
        proveedor.contacto_telefono = contacto_telefono !== undefined ? contacto_telefono : proveedor.contacto_telefono;
        proveedor.direccion = direccion !== undefined ? direccion : proveedor.direccion;
        proveedor.notas = notas !== undefined ? notas : proveedor.notas;
        
        await proveedorRepository.save(proveedor);
        res.status(200).json(proveedor);
        return;

    } catch (error) {
        console.error("Error en updateProveedor:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar el proveedor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar el proveedor." });
        return;
    }
};

export const deleteProveedor = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const proveedorRepository = AppDataSource.getRepository(Proveedor);
        const proveedor = await proveedorRepository.findOneBy({ id_proveedor: parseInt(id) });

        if (!proveedor) {
            res.status(404).json({ message: "Proveedor no encontrado para eliminar." });
            return;
        }

        // Lógica de negocio: ¿Qué pasa si este proveedor está asociado a productos?
        // Por ahora, se permite la eliminación. En un sistema real, se debería verificar.
        // Por ejemplo, buscando en la tabla Productos si algún producto tiene este id_proveedor_fk.

        await proveedorRepository.remove(proveedor);
        res.status(204).send();
        return;

    } catch (error) {
        console.error("Error en deleteProveedor:", error);
         if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
             res.status(409).json({ message: "No se puede eliminar el proveedor porque está en uso por uno o más productos.", error: error.message });
             return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al eliminar el proveedor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al eliminar el proveedor." });
        return;
    }
};