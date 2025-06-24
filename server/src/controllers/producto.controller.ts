// server/src/controllers/producto.controller.ts

import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Producto } from "../entities/Producto";
import { CategoriaProducto } from "../entities/CategoriaProducto";
import { UnidadMedida } from "../entities/UnidadMedida";
import { Proveedor } from "../entities/Proveedor";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ILike, Not } from "typeorm"; // Asegúrate de tener Not si lo usas en update
import { StockProducto } from '../entities/StockProducto';
import { Ubicacion } from "../entities/Ubicacion";

export const getAllProductos = async (req: Request, res: Response): Promise<void> => {
    try {
        const productoRepository = AppDataSource.getRepository(Producto);
        const productos = await productoRepository.find({
            relations: [
                "categoria",
                "unidad_medida_primaria",
                "unidad_conteo_alternativa",
                "proveedor_preferido"
            ],
            order: { nombre_producto: 'ASC' }
        });
        res.status(200).json(productos);
        return;
    } catch (error) {
        console.error("Error en getAllProductos:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener los productos.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener los productos." });
        return;
    }
};

// --- FUNCIÓN CREATEPRODUCTO CORREGIDA ---
export const createProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        sku,
        nombre_producto,
        descripcion_corta,
        descripcion_larga,
        id_categoria_fk, // ID de CategoriaProducto
        id_unidad_medida_primaria_fk, // ID de UnidadMedida
        stock_minimo,
        stock_maximo,
        ubicacion_almacen,
        imagen_url,
        id_proveedor_preferido_fk, // ID de Proveedor (opcional)
        id_unidad_conteo_alternativa_fk, // ID de UnidadMedida (opcional, puede ser null o undefined)
        cantidad_por_unidad_alternativa // Puede ser null o undefined
    } = req.body;

    // Validación de campos obligatorios básicos
    if (!sku || !nombre_producto || !id_unidad_medida_primaria_fk) {
        res.status(400).json({ message: "SKU, nombre del producto y unidad de medida primaria son requeridos." });
        return;
    }

    // Validaciones para unidad alternativa y su cantidad
    // 1. Si SÍ se define una unidad alternativa (no es null ni undefined)...
    if (id_unidad_conteo_alternativa_fk !== null && id_unidad_conteo_alternativa_fk !== undefined) {
        // ...entonces la cantidad para ella DEBE ser proporcionada y ser > 0.
        if (cantidad_por_unidad_alternativa === undefined || cantidad_por_unidad_alternativa === null || Number(cantidad_por_unidad_alternativa) <= 0) {
            res.status(400).json({ message: "Si se especifica una unidad de conteo alternativa, la cantidad por dicha unidad es requerida y debe ser mayor a 0." });
            return;
        }
    } 
    // 2. Else if NO se define una unidad alternativa (es null o undefined)...
    else if (id_unidad_conteo_alternativa_fk === null || id_unidad_conteo_alternativa_fk === undefined) {
        // ...entonces una cantidad para ella NO debe ser proporcionada (debe ser null o undefined).
        if (cantidad_por_unidad_alternativa !== null && cantidad_por_unidad_alternativa !== undefined) {
            res.status(400).json({ message: "No se puede ingresar cantidad por unidad alternativa si no se ha seleccionado una unidad de conteo alternativa." });
            return;
        }
    }

    try {
        const productoRepository = AppDataSource.getRepository(Producto);
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const unidadMedidaRepository = AppDataSource.getRepository(UnidadMedida);
        const proveedorRepository = AppDataSource.getRepository(Proveedor);

        const skuExistente = await productoRepository.findOneBy({ sku: ILike(sku) });
        if (skuExistente) {
            res.status(409).json({ message: "El SKU proporcionado ya está en uso." });
            return;
        }

        const nuevoProducto = new Producto();
        nuevoProducto.sku = sku;
        nuevoProducto.nombre_producto = nombre_producto;
        nuevoProducto.descripcion_corta = descripcion_corta || null;
        nuevoProducto.descripcion_larga = descripcion_larga || null;
        nuevoProducto.stock_minimo = stock_minimo !== undefined ? Number(stock_minimo) : 0;
        nuevoProducto.stock_maximo = (stock_maximo !== undefined && stock_maximo !== null) ? Number(stock_maximo) : null;
        nuevoProducto.ubicacion_almacen = ubicacion_almacen || null;
        nuevoProducto.imagen_url = imagen_url || null;

        if (id_categoria_fk) {
            const categoria = await categoriaRepository.findOneBy({ id_categoria: id_categoria_fk });
            if (!categoria) {
                res.status(404).json({ message: `Categoría con ID ${id_categoria_fk} no encontrada.` });
                return;
            }
            nuevoProducto.categoria = categoria;
        } else {
            nuevoProducto.categoria = null;
        }

        const unidadPrimaria = await unidadMedidaRepository.findOneBy({ id_unidad_medida: id_unidad_medida_primaria_fk });
        if (!unidadPrimaria) {
            res.status(404).json({ message: `Unidad de medida primaria con ID ${id_unidad_medida_primaria_fk} no encontrada.` });
            return;
        }
        nuevoProducto.unidad_medida_primaria = unidadPrimaria;

        if (id_unidad_conteo_alternativa_fk) { // Solo si se proporcionó un ID
            const unidadAlternativa = await unidadMedidaRepository.findOneBy({ id_unidad_medida: id_unidad_conteo_alternativa_fk });
            if (!unidadAlternativa) {
                res.status(404).json({ message: `Unidad de conteo alternativa con ID ${id_unidad_conteo_alternativa_fk} no encontrada.` });
                return;
            }
            if (unidadAlternativa.id_unidad_medida === unidadPrimaria.id_unidad_medida) {
                res.status(400).json({ message: "La unidad de conteo alternativa no puede ser la misma que la unidad primaria." });
                return;
            }
            nuevoProducto.unidad_conteo_alternativa = unidadAlternativa;
            // En este punto, gracias a la validación anterior, cantidad_por_unidad_alternativa es un número > 0
            nuevoProducto.cantidad_por_unidad_alternativa = Number(cantidad_por_unidad_alternativa);
        } else { // Si no se proporcionó id_unidad_conteo_alternativa_fk (es null o undefined)
            nuevoProducto.unidad_conteo_alternativa = null;
            nuevoProducto.cantidad_por_unidad_alternativa = null; // Aseguramos que la cantidad también sea null
        }

        if (id_proveedor_preferido_fk) {
            const proveedor = await proveedorRepository.findOneBy({ id_proveedor: id_proveedor_preferido_fk });
            if (!proveedor) {
                res.status(404).json({ message: `Proveedor con ID ${id_proveedor_preferido_fk} no encontrado.` });
                return;
            }
            nuevoProducto.proveedor_preferido = proveedor;
        } else {
            nuevoProducto.proveedor_preferido = null;
        }
        
        // stock_actual por defecto es 0 según la entidad y no se establece aquí

        await productoRepository.save(nuevoProducto);
        const productoGuardado = await productoRepository.findOne({
            where: { id_producto: nuevoProducto.id_producto },
            relations: ["categoria", "unidad_medida_primaria", "unidad_conteo_alternativa", "proveedor_preferido"]
        });
        res.status(201).json(productoGuardado);
        return;

    } catch (error) {
        console.error("Error en createProducto:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al crear el producto.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al crear el producto." });
        return;
    }
};

// Aquí van tus otras funciones: getProductoById, updateProducto, deleteProducto
// Asegúrate de aplicar una lógica de validación similar para la unidad alternativa
// en la función updateProducto.

export const getProductoById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const productoRepository = AppDataSource.getRepository(Producto);
        const producto = await productoRepository.findOne({
            where: { id_producto: parseInt(id) },
            relations: [
                "categoria",
                "unidad_medida_primaria",
                "unidad_conteo_alternativa",
                "proveedor_preferido"
            ]
        });

        if (!producto) {
            res.status(404).json({ message: "Producto no encontrado." });
            return; // Este sí es necesario para salir temprano
        }
        
        res.status(200).json(producto);
        // No necesitas return aquí al final
    } catch (error) {
        console.error("Error en getProductoById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener el producto.", error: error.message });
        } else {
            res.status(500).json({ message: "Error al obtener el producto." });
        }
        // No necesitas return aquí al final
    }
};

export const updateProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        sku,
        nombre_producto,
        descripcion_corta,
        descripcion_larga,
        id_categoria_fk,
        id_unidad_medida_primaria_fk,
        stock_minimo,
        stock_maximo,
        ubicacion_almacen,
        imagen_url,
        id_proveedor_preferido_fk,
        id_unidad_conteo_alternativa_fk,
        cantidad_por_unidad_alternativa
    } = req.body;

    // Validaciones básicas
    if (!sku || !nombre_producto || !id_unidad_medida_primaria_fk) {
        res.status(400).json({ message: "SKU, nombre del producto y unidad de medida primaria son requeridos." });
        return;
    }

    // Validaciones para unidad alternativa
    if (id_unidad_conteo_alternativa_fk !== null && id_unidad_conteo_alternativa_fk !== undefined) {
        if (cantidad_por_unidad_alternativa === undefined || cantidad_por_unidad_alternativa === null || Number(cantidad_por_unidad_alternativa) <= 0) {
            res.status(400).json({ message: "Si se especifica una unidad de conteo alternativa, la cantidad por dicha unidad es requerida y debe ser mayor a 0." });
            return;
        }
    } else if (id_unidad_conteo_alternativa_fk === null || id_unidad_conteo_alternativa_fk === undefined) {
        if (cantidad_por_unidad_alternativa !== null && cantidad_por_unidad_alternativa !== undefined) {
            res.status(400).json({ message: "No se puede ingresar cantidad por unidad alternativa si no se ha seleccionado una unidad de conteo alternativa." });
            return;
        }
    }

    try {
        const productoRepository = AppDataSource.getRepository(Producto);
        const categoriaRepository = AppDataSource.getRepository(CategoriaProducto);
        const unidadMedidaRepository = AppDataSource.getRepository(UnidadMedida);
        const proveedorRepository = AppDataSource.getRepository(Proveedor);

        // Buscar el producto con todas las relaciones
        let producto = await productoRepository.findOne({
            where: { id_producto: parseInt(id) },
            relations: [
                "categoria",
                "unidad_medida_primaria",
                "unidad_conteo_alternativa",
                "proveedor_preferido"
            ]
        });

        if (!producto) {
            res.status(404).json({ message: "Producto no encontrado para actualizar." });
            return;
        }

        // Validar unicidad del SKU si cambió
        if (sku && sku !== producto.sku) {
            const skuExistente = await productoRepository.findOneBy({ 
                sku: ILike(sku), 
                id_producto: Not(parseInt(id)) 
            });
            if (skuExistente) {
                res.status(409).json({ message: "El nuevo SKU proporcionado ya está en uso por otro producto." });
                return;
            }
            producto.sku = sku;
        }

        // Actualizar campos básicos
        if (nombre_producto !== undefined) producto.nombre_producto = nombre_producto;
        if (descripcion_corta !== undefined) producto.descripcion_corta = descripcion_corta || null;
        if (descripcion_larga !== undefined) producto.descripcion_larga = descripcion_larga || null;
        if (stock_minimo !== undefined) producto.stock_minimo = stock_minimo !== null ? Number(stock_minimo) : 0;
        if (stock_maximo !== undefined) producto.stock_maximo = (stock_maximo !== null && stock_maximo !== '') ? Number(stock_maximo) : null;
        if (ubicacion_almacen !== undefined) producto.ubicacion_almacen = ubicacion_almacen || null;
        if (imagen_url !== undefined) producto.imagen_url = imagen_url || null;

        // Actualizar categoría
        if (id_categoria_fk !== undefined) {
            if (id_categoria_fk === null || id_categoria_fk === '') {
                producto.categoria = null;
            } else {
                const categoria = await categoriaRepository.findOneBy({ id_categoria: id_categoria_fk });
                if (!categoria) {
                    res.status(404).json({ message: `Categoría con ID ${id_categoria_fk} no encontrada.` });
                    return;
                }
                producto.categoria = categoria;
            }
        }

        // Actualizar unidad de medida primaria
        if (id_unidad_medida_primaria_fk !== undefined) {
            const unidadPrimaria = await unidadMedidaRepository.findOneBy({ 
                id_unidad_medida: id_unidad_medida_primaria_fk 
            });
            if (!unidadPrimaria) {
                res.status(404).json({ message: `Unidad de medida primaria con ID ${id_unidad_medida_primaria_fk} no encontrada.` });
                return;
            }
            producto.unidad_medida_primaria = unidadPrimaria;
        }

        // Actualizar proveedor preferido
        if (id_proveedor_preferido_fk !== undefined) {
            if (id_proveedor_preferido_fk === null || id_proveedor_preferido_fk === '') {
                producto.proveedor_preferido = null;
            } else {
                const proveedor = await proveedorRepository.findOneBy({ 
                    id_proveedor: id_proveedor_preferido_fk 
                });
                if (!proveedor) {
                    res.status(404).json({ message: `Proveedor con ID ${id_proveedor_preferido_fk} no encontrado.` });
                    return;
                }
                producto.proveedor_preferido = proveedor;
            }
        }

        // Actualizar unidad de conteo alternativa
        if (id_unidad_conteo_alternativa_fk !== undefined) {
            if (id_unidad_conteo_alternativa_fk === null || id_unidad_conteo_alternativa_fk === '') {
                // Quitar la unidad alternativa
                producto.unidad_conteo_alternativa = null;
                producto.cantidad_por_unidad_alternativa = null;
            } else {
                // Establecer nueva unidad alternativa
                const unidadAlternativa = await unidadMedidaRepository.findOneBy({ 
                    id_unidad_medida: id_unidad_conteo_alternativa_fk 
                });
                if (!unidadAlternativa) {
                    res.status(404).json({ message: `Unidad de conteo alternativa con ID ${id_unidad_conteo_alternativa_fk} no encontrada.` });
                    return;
                }
                // Verificar que no sea la misma que la primaria
                if (unidadAlternativa.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                    res.status(400).json({ message: "La unidad de conteo alternativa no puede ser la misma que la unidad primaria." });
                    return;
                }
                producto.unidad_conteo_alternativa = unidadAlternativa;
                producto.cantidad_por_unidad_alternativa = Number(cantidad_por_unidad_alternativa);
            }
        }

        // Actualizar cantidad por unidad alternativa si se proporciona independientemente
        if (cantidad_por_unidad_alternativa !== undefined && id_unidad_conteo_alternativa_fk === undefined) {
            // Solo actualizar si ya tiene una unidad alternativa definida
            if (producto.unidad_conteo_alternativa) {
                if (cantidad_por_unidad_alternativa === null || cantidad_por_unidad_alternativa === '') {
                    res.status(400).json({ message: "No se puede quitar la cantidad por unidad alternativa sin quitar la unidad alternativa." });
                    return;
                }
                producto.cantidad_por_unidad_alternativa = Number(cantidad_por_unidad_alternativa);
            }
        }

        // Guardar los cambios
        await productoRepository.save(producto);

        // Obtener el producto actualizado con todas las relaciones
        const productoActualizado = await productoRepository.findOne({
            where: { id_producto: parseInt(id) },
            relations: ["categoria", "unidad_medida_primaria", "unidad_conteo_alternativa", "proveedor_preferido"]
        });

        res.status(200).json(productoActualizado);
        return;

    } catch (error) {
        console.error("Error en updateProducto:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar el producto.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar el producto." });
        return;
    }
};
export const getUbicacionesByProductoId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idProducto = parseInt(req.params.id);
    if (isNaN(idProducto)) {
      res.status(400).json({ message: "ID de producto inválido." });
      return;
    }

    const stockRepository = AppDataSource.getRepository(StockProducto);
    const stocks = await stockRepository.find({
      where: { producto: { id_producto: idProducto } },
      relations: ['ubicacion', 'producto'],
    });

    const ubicacionesUnicas = stocks
      .map(stock => stock.ubicacion)
      .filter(
        (ubicacion, index, self) =>
          ubicacion &&
          self.findIndex(u => u.id_ubicacion === ubicacion.id_ubicacion) === index
      )
      .map(ubicacion => {
        // Encontrar todos los stocks para esta ubicación
        const stocksEnUbicacion = stocks.filter(s => s.ubicacion.id_ubicacion === ubicacion.id_ubicacion);
        
        return {
          ...ubicacion,
          productos_en_ubicacion: stocksEnUbicacion.map(stock => ({
            id_producto: stock.producto.id_producto,
            nombre_producto: stock.producto.nombre_producto,
            cantidad: stock.cantidad,
            sku: stock.producto.sku
          }))
        };
      });

    res.json(ubicacionesUnicas);
  } catch (error: any) {
    next(error);
  }
};
export const updateProductoUbicaciones = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { ubicacionIds } = req.body; // Esperamos un array de IDs de ubicación

    if (!Array.isArray(ubicacionIds)) {
        res.status(400).json({ message: "Se esperaba un array de IDs de ubicación." });
        return; // ✅ Cambiar la posición del return
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const idProducto = parseInt(id);

        // 1. Eliminar TODAS las asignaciones de stock existentes para este producto.
        // Esto es más simple y seguro que calcular diferencias.
        await queryRunner.manager.delete(StockProducto, { producto: { id_producto: idProducto } });

        // 2. Crear las nuevas asignaciones basadas en el array recibido.
        for (const idUbicacion of ubicacionIds) {
            const nuevoStock = new StockProducto();
            nuevoStock.producto = { id_producto: idProducto } as Producto;
            nuevoStock.ubicacion = { id_ubicacion: idUbicacion } as Ubicacion;
            nuevoStock.cantidad = 0; // Se asigna la ubicación, pero el stock se ajustará con conteos o movimientos.
            await queryRunner.manager.save(nuevoStock);
        }

        await queryRunner.commitTransaction();
        res.status(200).json({ message: "Ubicaciones del producto actualizadas correctamente." });

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en updateProductoUbicaciones:", error);
        res.status(500).json({ 
            message: "Error al actualizar las ubicaciones del producto.", 
            error: error instanceof Error ? error.message : "Error desconocido"
        });
    } finally {
        await queryRunner.release();
    }
};
export const deleteProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const productoRepository = AppDataSource.getRepository(Producto);
        const producto = await productoRepository.findOneBy({ id_producto: parseInt(id) });

        if (!producto) {
            res.status(404).json({ message: "Producto no encontrado para eliminar." });
            return;
        }
        await productoRepository.remove(producto);
        res.status(204).send();
        return;
    } catch (error) {
        console.error("Error en deleteProducto:", error);
        if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
            res.status(409).json({ message: "No se puede eliminar el producto porque tiene registros asociados.", error: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al eliminar el producto.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al eliminar el producto." });
        return;
    }
};
export const searchProductos = async (req: Request, res: Response): Promise<void> => {
    const { termino } = req.query;

    if (!termino || typeof termino !== 'string') {
        res.status(400).json({ message: "Se requiere un 'termino' de búsqueda." });
        return;
    }

    try {
        const productoRepo = AppDataSource.getRepository(Producto);
        const productos = await productoRepo.find({
            where: [
                { nombre_producto: ILike(`%${termino}%`) },
                { sku: ILike(`%${termino}%`) }
            ],
            take: 10 // Limitar a 10 resultados para no sobrecargar
        });
        res.status(200).json(productos);
        return;
    } catch (error) { /* ... manejo de errores ... */ }
};