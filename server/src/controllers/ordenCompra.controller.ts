// server/src/controllers/ordenCompra.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { OrdenCompra } from "../entities/OrdenCompra";
import { DetalleOrdenCompra } from "../entities/DetalleOrdenCompra";
import { Proveedor } from "../entities/Proveedor";
import { Producto } from "../entities/Producto";
import { User } from "../entities/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MovimientoInventario } from "../entities/MovimientoInventario";
import { TipoMovimiento } from "../entities/TipoMovimiento";

interface DetalleInput {
    id_producto_fk: number;
    cantidad_solicitada: number;
    costo_unitario: number;
}
interface DetalleRecepcionInput {
    id_detalle_orden: number;
    cantidad_recibida: number;
}


export const createOrdenCompra = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        id_proveedor_fk,
        fecha_emision,
        fecha_entrega_esperada,
        notas,
        detalles
    }: {
        id_proveedor_fk: number;
        fecha_emision: string;
        fecha_entrega_esperada?: string;
        notas?: string;
        detalles: DetalleInput[];
    } = req.body;

    const id_usuario_creador_fk = req.user!.id;

    if (!id_proveedor_fk || !fecha_emision || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        res.status(400).json({ message: "Proveedor, fecha de emisión y al menos un detalle son requeridos." });
        return;
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const proveedorRepo = transactionalEntityManager.getRepository(Proveedor);
            const usuarioRepo = transactionalEntityManager.getRepository(User);
            const productoRepo = transactionalEntityManager.getRepository(Producto);

            const proveedor = await proveedorRepo.findOneBy({ id_proveedor: id_proveedor_fk });
            if (!proveedor) throw new Error(`Proveedor con ID ${id_proveedor_fk} no encontrado.`);

            const usuario = await usuarioRepo.findOneBy({ id_usuario: id_usuario_creador_fk });
            if (!usuario) throw new Error("Usuario creador no encontrado.");

            // 1. Crear y guardar la cabecera de la orden para obtener su ID
            const nuevaOrden = new OrdenCompra();
            nuevaOrden.proveedor = proveedor;
            nuevaOrden.usuario_creador = usuario;
            nuevaOrden.fecha_emision = new Date(fecha_emision);
            if (fecha_entrega_esperada) nuevaOrden.fecha_entrega_esperada = new Date(fecha_entrega_esperada);
            nuevaOrden.notas = notas || null;
            nuevaOrden.estado = 'Borrador'; // Estado inicial

            // La guardamos una vez para generar el ID
            const ordenGuardada = await transactionalEntityManager.save(OrdenCompra, nuevaOrden);

            let subtotalCalculado = 0;

            // 2. Crear y guardar los detalles
            for (const item of detalles) {
                const producto = await productoRepo.findOneBy({ id_producto: item.id_producto_fk });
                if (!producto) throw new Error(`Producto con ID ${item.id_producto_fk} no encontrado en el detalle.`);

                const nuevoDetalle = new DetalleOrdenCompra();
                nuevoDetalle.orden_compra = ordenGuardada; // Enlazar con la cabecera
                nuevoDetalle.producto = producto;
                nuevoDetalle.cantidad_solicitada = Number(item.cantidad_solicitada);
                nuevoDetalle.costo_unitario = Number(item.costo_unitario);

                subtotalCalculado += nuevoDetalle.cantidad_solicitada * nuevoDetalle.costo_unitario;

                await transactionalEntityManager.save(DetalleOrdenCompra, nuevoDetalle);
            }

            // 3. Actualizar la orden principal con los totales calculados
            ordenGuardada.subtotal = subtotalCalculado;
            // Asumimos un IVA del 13% como ejemplo para Bolivia. Esto podría ser configurable.
            ordenGuardada.impuestos = subtotalCalculado * 0.13; 
            ordenGuardada.total = ordenGuardada.subtotal + ordenGuardada.impuestos;

            await transactionalEntityManager.save(OrdenCompra, ordenGuardada);

            // Recargar para devolver la orden completa con sus detalles
            const ordenCompleta = await transactionalEntityManager.findOne(OrdenCompra, {
                where: { id_orden_compra: ordenGuardada.id_orden_compra },
                relations: ["proveedor", "usuario_creador", "detalles", "detalles.producto"]
            });

            res.status(201).json(ordenCompleta);
            return;

        } catch (error) {
            console.error("Error en transacción de createOrdenCompra:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al crear la orden de compra." });
                } else {
                    res.status(500).json({ message: "Error desconocido al crear la orden de compra." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en createOrdenCompra:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al crear la orden.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al crear la orden con error desconocido." });
            }
        }
    });
};

export const getAllOrdenesCompra = async (req: Request, res: Response): Promise<void> => {
    try {
        const ordenRepo = AppDataSource.getRepository(OrdenCompra);
        const ordenes = await ordenRepo.find({
            relations: ["proveedor", "usuario_creador", "detalles", "detalles.producto"],
            order: { fecha_emision: "DESC" }
        });
        res.status(200).json(ordenes);
        return;
    } catch (error) {
        console.error("Error en getAllOrdenesCompra:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener las órdenes de compra.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener las órdenes de compra." });
        return;
    }
};

export const getOrdenCompraById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const ordenRepo = AppDataSource.getRepository(OrdenCompra);
        const orden = await ordenRepo.findOne({
            where: { id_orden_compra: parseInt(id) },
            relations: ["proveedor", "usuario_creador", "detalles", "detalles.producto", "detalles.producto.unidad_medida_primaria"]
        });

        if (!orden) {
            res.status(404).json({ message: "Orden de compra no encontrada." });
            return;
        }
        res.status(200).json(orden);
        return;
    } catch (error) {
        console.error("Error en getOrdenCompraById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener la orden de compra.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener la orden de compra." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const updateOrdenCompraEstado = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    const id_usuario_modificador = req.user!.id; // Usuario que realiza el cambio

    const estadosValidos = ['Borrador', 'Enviada', 'Recibida Parcialmente', 'Recibida Totalmente', 'Cancelada'];
    if (!nuevo_estado || !estadosValidos.includes(nuevo_estado)) {
        res.status(400).json({ message: `Estado no válido. Los estados permitidos son: ${estadosValidos.join(', ')}` });
        return;
    }

    try {
        const ordenRepo = AppDataSource.getRepository(OrdenCompra);
        const orden = await ordenRepo.findOneBy({ id_orden_compra: parseInt(id) });

        if (!orden) {
            res.status(404).json({ message: "Orden de compra no encontrada para actualizar." });
            return;
        }

        // Lógica de negocio simple para transiciones de estado
        if (orden.estado === 'Recibida Totalmente' || orden.estado === 'Cancelada') {
            res.status(409).json({ message: `No se puede cambiar el estado de una orden que ya está '${orden.estado}'.` });
            return;
        }

        orden.estado = nuevo_estado;
        // Podríamos registrar quién hizo el último cambio si tuviéramos un campo para ello
        // orden.usuario_ultima_modificacion = usuarioModificador;

        await ordenRepo.save(orden);
        res.status(200).json(orden);
        return;

    } catch (error) {
        console.error("Error en updateOrdenCompraEstado:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al actualizar el estado de la orden.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al actualizar el estado de la orden." });
        return;
    }
};
export const registrarRecepcion = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: idOrdenCompra } = req.params;
    const detallesRecepcion: DetalleRecepcionInput[] = req.body;
    const id_usuario_recepcion = req.user!.id;

    if (!Array.isArray(detallesRecepcion) || detallesRecepcion.length === 0) {
        res.status(400).json({ message: "Se requiere un array de detalles de la recepción." });
        return;
    }

    await AppDataSource.manager.transaction(async (tem) => { // tem = transactionalEntityManager
        try {
            const ordenRepo = tem.getRepository(OrdenCompra);
            const detalleOrdenRepo = tem.getRepository(DetalleOrdenCompra);
            const productoRepo = tem.getRepository(Producto);
            const tipoMovRepo = tem.getRepository(TipoMovimiento);
            const usuarioRepo = tem.getRepository(User);

            const orden = await ordenRepo.findOne({
                where: { id_orden_compra: parseInt(idOrdenCompra) },
                relations: ["detalles", "detalles.producto", "detalles.producto.unidad_medida_primaria"]
            });

            if (!orden) throw new Error(`Orden de Compra con ID ${idOrdenCompra} no encontrada.`);
            if (!['Enviada', 'Recibida Parcialmente'].includes(orden.estado)) {
                throw new Error(`No se puede registrar una recepción para una orden en estado '${orden.estado}'.`);
            }

            const usuario = await usuarioRepo.findOneBy({ id_usuario: id_usuario_recepcion });
            if (!usuario) throw new Error("Usuario no encontrado.");

            const tipoMovEntrada = await tipoMovRepo.findOneBy({ nombre_tipo: 'Entrada por Compra' });
            if (!tipoMovEntrada) throw new Error("Tipo de movimiento 'Entrada por Compra' no encontrado.");

            for (const itemRecibido of detallesRecepcion) {
                const detalleOrden = orden.detalles.find(d => d.id_detalle_orden === itemRecibido.id_detalle_orden);
                if (!detalleOrden) throw new Error(`El detalle con ID ${itemRecibido.id_detalle_orden} no pertenece a esta orden de compra.`);

                const cantidadRecibidaNum = Number(itemRecibido.cantidad_recibida);
                if (cantidadRecibidaNum <= 0) continue; // Ignorar recepciones con cantidad 0 o negativa

                const cantidadPendiente = detalleOrden.cantidad_solicitada - detalleOrden.cantidad_recibida;
                if (cantidadRecibidaNum > cantidadPendiente) {
                    throw new Error(`Para el producto '${detalleOrden.producto.nombre_producto}', se intentan recibir ${cantidadRecibidaNum} unidades, pero solo quedan ${cantidadPendiente} pendientes.`);
                }

                const producto = detalleOrden.producto;
                const stockAnterior = producto.stock_actual;
                const stockNuevo = stockAnterior + cantidadRecibidaNum;

                // 1. Crear el movimiento de inventario
                const movimiento = new MovimientoInventario();
                movimiento.producto = producto;
                movimiento.tipo_movimiento = tipoMovEntrada;
                movimiento.cantidad_movida = cantidadRecibidaNum;
                movimiento.unidad_medida_movimiento = producto.unidad_medida_primaria;
                movimiento.cantidad_convertida_a_primaria = cantidadRecibidaNum;
                movimiento.stock_anterior_primaria = stockAnterior;
                movimiento.stock_nuevo_primaria = stockNuevo;
                movimiento.usuario = usuario;
                movimiento.referencia_documento = `OC #${orden.id_orden_compra}`;
                await tem.save(MovimientoInventario, movimiento);

                // 2. Actualizar stock del producto
                producto.stock_actual = stockNuevo;
                await tem.save(Producto, producto);

                // 3. Actualizar la cantidad recibida en el detalle de la orden
                detalleOrden.cantidad_recibida += cantidadRecibidaNum;
                await tem.save(DetalleOrdenCompra, detalleOrden);
            }

            // 4. Actualizar el estado general de la orden
            const todosLosDetallesCompletos = orden.detalles.every(d => d.cantidad_recibida >= d.cantidad_solicitada);
            orden.estado = todosLosDetallesCompletos ? 'Recibida Totalmente' : 'Recibida Parcialmente';
            await tem.save(OrdenCompra, orden);

            const ordenActualizada = await ordenRepo.findOne({
                where: { id_orden_compra: parseInt(idOrdenCompra) },
                relations: ["proveedor", "usuario_creador", "detalles", "detalles.producto"]
            });

            res.status(200).json(ordenActualizada);
            return;

        } catch (error) {
            if (!res.headersSent) {
                if (error instanceof Error) res.status(400).json({ message: error.message });
                else res.status(500).json({ message: "Error desconocido al registrar la recepción." });
            }
        }
    }).catch(transactionError => {
        if (!res.headersSent) {
            if (transactionError instanceof Error) res.status(500).json({ message: "Fallo la transacción.", error: transactionError.message });
            else res.status(500).json({ message: "Fallo la transacción con error desconocido." });
        }
    });
};