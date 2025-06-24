// server/src/controllers/ubicacion.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Ubicacion } from "../entities/Ubicacion";
import { AuthRequest } from "../middlewares/auth.middleware";
import { StockProducto } from '../entities/StockProducto';
import { IsNull } from "typeorm";

export const createUbicacion = async (req: AuthRequest, res: Response): Promise<void> => {
    const { 
        nombre, 
        tipo, 
        descripcion, 
        id_ubicacion_padre_fk, 
        codigo_legible,
        capacidad,
        pos_x,
        pos_y,
        width,
        height
    } = req.body;

    if (!nombre) {
        res.status(400).json({ message: "El nombre de la ubicación es requerido." });
        return;
    }

    try {
        const ubicacionRepo = AppDataSource.getRepository(Ubicacion);

        const nuevaUbicacion = new Ubicacion();
        nuevaUbicacion.nombre = nombre;
        nuevaUbicacion.tipo = tipo || null;
        nuevaUbicacion.descripcion = descripcion || null;
        nuevaUbicacion.codigo_legible = codigo_legible || null;
        nuevaUbicacion.capacidad = capacidad || null;
        nuevaUbicacion.pos_x = pos_x !== undefined ? pos_x : null;
        nuevaUbicacion.pos_y = pos_y !== undefined ? pos_y : null;
        nuevaUbicacion.width = width !== undefined ? width : null;
        nuevaUbicacion.height = height !== undefined ? height : null;

        if (id_ubicacion_padre_fk) {
            const padre = await ubicacionRepo.findOneBy({ id_ubicacion: id_ubicacion_padre_fk });
            if (!padre) {
                res.status(404).json({ message: `La ubicación padre con ID ${id_ubicacion_padre_fk} no fue encontrada.` });
                return;
            }
            nuevaUbicacion.padre = padre;
        }

        await ubicacionRepo.save(nuevaUbicacion);
        res.status(201).json(nuevaUbicacion);
        return;

    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al crear la ubicación.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al crear la ubicación." });
        return;
    }
};
export const getUbicacionesConStock = async (req: Request, res: Response) => {
    try {
        const ubicacionRepository = AppDataSource.getRepository(Ubicacion);
        
        // Usamos el QueryBuilder para una consulta más compleja:
        // Seleccionamos las ubicaciones y, para cada una, unimos la información
        // del stock y los productos asociados a ese stock.
        const ubicaciones = await ubicacionRepository.createQueryBuilder("ubicacion")
            .leftJoinAndSelect("ubicacion.stockProductos", "stock")
            .leftJoinAndSelect("stock.producto", "producto")
            .getMany();
            
        // Transformar los datos para que coincidan con la interfaz del frontend
        const ubicacionesTransformadas = ubicaciones.map(ubicacion => ({
            ...ubicacion,
            productos_en_ubicacion: ubicacion.stockProductos?.map(stock => ({
                id_producto: stock.producto.id_producto,
                nombre_producto: stock.producto.nombre_producto,
                cantidad: stock.cantidad,
                sku: stock.producto.sku
            })) || []
        }));
            
        res.json(ubicacionesTransformadas);

    } catch (error: any) {
        res.status(500).json({ message: "Error al obtener las ubicaciones con stock.", error: error.message });
    }
};
export const verificarProductoEnUbicacion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const idUbicacion = parseInt(req.params.id);
    const idProducto = parseInt(req.params.producto_id);

    if (isNaN(idUbicacion) || isNaN(idProducto)) {
      res.status(400).json({ message: "IDs de ubicación o producto inválidos." });
      return;
    }

    const stockRepository = AppDataSource.getRepository(StockProducto);
    const stock = await stockRepository.findOne({
      where: {
        ubicacion: { id_ubicacion: idUbicacion },
        producto: { id_producto: idProducto },
      },
    });

    res.json({ tiene_producto: !!stock });
  } catch (error: any) {
    res.status(500).json({
      message: "Error al verificar el producto en la ubicación.",
      error: error.message,
    });
  }
};
export const getAllUbicaciones = async (req: Request, res: Response): Promise<void> => {
    try {
        const ubicacionRepo = AppDataSource.getRepository(Ubicacion);
        // findTree es una opción, pero para construir un JSON jerárquico, a veces es mejor hacerlo manualmente.
        // Primero obtenemos todas las ubicaciones.
        const todasLasUbicaciones = await ubicacionRepo.find({ relations: ["padre"] });

        // Función para construir el árbol
        const construirArbol = (list: Ubicacion[]) => {
            const map: { [key: number]: Ubicacion & { hijos?: Ubicacion[] } } = {};
            const roots: Ubicacion[] = [];

            list.forEach(node => {
                map[node.id_ubicacion] = { ...node, hijos: [] };
            });

            list.forEach(node => {
                if (node.padre && map[node.padre.id_ubicacion]) {
                    map[node.padre.id_ubicacion].hijos?.push(map[node.id_ubicacion]);
                } else {
                    roots.push(map[node.id_ubicacion]);
                }
            });
            return roots;
        };

        const arbolUbicaciones = construirArbol(todasLasUbicaciones);

        res.status(200).json(arbolUbicaciones);
        return;
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener las ubicaciones.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener las ubicaciones." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const getUbicacionById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const ubicacionRepo = AppDataSource.getRepository(Ubicacion);
        const ubicacion = await ubicacionRepo.findOne({
            where: { id_ubicacion: parseInt(id) },
            relations: ["padre", "hijos"] // Cargar padre e hijos para tener contexto
        });
        if (!ubicacion) {
            res.status(404).json({ message: "Ubicación no encontrada." });
            return;
        }
        res.status(200).json(ubicacion);
        return;
    } catch (error) { /* ... manejo de errores ... */ }
};

// --- NUEVA FUNCIÓN ---
export const updateUbicacion = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { 
        nombre, 
        tipo, 
        descripcion, 
        codigo_legible, 
        capacidad, 
        id_ubicacion_padre_fk,
        pos_x,
        pos_y,
        width,
        height
    } = req.body;
    try {
        const ubicacionRepo = AppDataSource.getRepository(Ubicacion);
        let ubicacion = await ubicacionRepo.findOneBy({ id_ubicacion: parseInt(id) });
        if (!ubicacion) {
            res.status(404).json({ message: "Ubicación no encontrada para actualizar." });
            return;
        }

        // Actualizar campos si se proporcionan
        if (nombre !== undefined) ubicacion.nombre = nombre;
        if (tipo !== undefined) ubicacion.tipo = tipo;
        if (descripcion !== undefined) ubicacion.descripcion = descripcion;
        if (codigo_legible !== undefined) ubicacion.codigo_legible = codigo_legible;
        if (capacidad !== undefined) ubicacion.capacidad = capacidad;
        if (pos_x !== undefined) ubicacion.pos_x = pos_x;
        if (pos_y !== undefined) ubicacion.pos_y = pos_y;
        if (width !== undefined) ubicacion.width = width;
        if (height !== undefined) ubicacion.height = height;

        if (id_ubicacion_padre_fk !== undefined) {
            if (id_ubicacion_padre_fk === null) {
                ubicacion.padre = null;
            } else {
                const padre = await ubicacionRepo.findOneBy({ id_ubicacion: id_ubicacion_padre_fk });
                if (!padre) throw new Error("La nueva ubicación padre no existe.");
                ubicacion.padre = padre;
            }
        }

        await ubicacionRepo.save(ubicacion);
        res.status(200).json(ubicacion);
        return;
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar la ubicación.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar la ubicación." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const deleteUbicacion = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const ubicacionRepo = AppDataSource.getRepository(Ubicacion);
        const ubicacion = await ubicacionRepo.findOneBy({ id_ubicacion: parseInt(id) });
        if (!ubicacion) {
            res.status(404).json({ message: "Ubicación no encontrada para eliminar." });
            return;
        }
        // onDelete: 'CASCADE' en la entidad se encarga de los hijos.
        // La BD lanzará un error si la ubicación está en uso en la tabla stock_productos.
        await ubicacionRepo.remove(ubicacion);
        res.status(204).send();
        return;
    } catch (error: any) {
        if (error.code === '23503') {
            res.status(409).json({ message: "No se puede eliminar la ubicación porque contiene productos o sub-ubicaciones." });
            return;
        }
        // ... otro manejo de errores ...
    }
};

// Aquí irían las funciones para getById, update y delete