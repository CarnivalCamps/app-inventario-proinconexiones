// server/src/controllers/movimiento.controller.ts

import { Response, Request } from "express";
import { AppDataSource } from "../data-source";
import { Producto } from "../entities/Producto";
import { UnidadMedida } from "../entities/UnidadMedida";
import { TipoMovimiento } from "../entities/TipoMovimiento";
import { RazonMovimiento } from "../entities/RazonMovimiento";
import { MovimientoInventario } from "../entities/MovimientoInventario";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DetalleSolicitudReserva } from "../entities/DetalleSolicitudReserva";
import { User } from "../entities/User";
import { Ubicacion } from "../entities/Ubicacion";
import { StockProducto } from "../entities/StockProducto";

export const getAllMovimientos = async (req: Request, res: Response): Promise<void> => {
    const { id_producto_fk } = req.query;

    try {
        const movimientoRepository = AppDataSource.getRepository(MovimientoInventario);

        // Construir opciones de consulta
        const findOptions: any = {
            relations: [
                "producto",
                "usuario",
                "tipo_movimiento",
                "unidad_medida_movimiento",
                "razon_movimiento",
                "ubicacion",
                "detalle_solicitud_reserva",
                "detalle_solicitud_reserva.solicitud_reserva",
                "detalle_conteo_fisico"
            ],
            order: {
                fecha_movimiento: "DESC" // Los más recientes primero
            },
            where: {}
        };

        // Aplicar filtro si se proporciona
        if (id_producto_fk) {
            findOptions.where.producto = { id_producto: Number(id_producto_fk) };
        }

        const movimientos = await movimientoRepository.find(findOptions);

        res.status(200).json(movimientos);
        return;

    } catch (error) {
        console.error("Error en getAllMovimientos:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener el historial de movimientos.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener el historial de movimientos." });
        return;
    }
};

export const registrarEntrada = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        id_producto_fk,
        cantidad_movida,
        id_unidad_medida_movimiento_fk,
        id_tipo_movimiento_fk,
        id_ubicacion_fk,
        referencia_documento,
        notas_adicionales,
        id_razon_movimiento_fk
    } = req.body;
    
    const id_usuario_fk = req.user!.id;

    if (!id_producto_fk || !cantidad_movida || !id_unidad_medida_movimiento_fk || !id_tipo_movimiento_fk || !id_ubicacion_fk) {
        res.status(400).json({ message: "Producto, cantidad, unidad, tipo de movimiento y ubicación son requeridos." });
        return;
    }

    await AppDataSource.manager.transaction(async (tem) => {
        try {
            const productoRepo = tem.getRepository(Producto);
            const ubicacionRepo = tem.getRepository(Ubicacion);
            const stockProductoRepo = tem.getRepository(StockProducto);
            const unidadMedidaRepo = tem.getRepository(UnidadMedida);
            const tipoMovimientoRepo = tem.getRepository(TipoMovimiento);
            const razonMovimientoRepo = tem.getRepository(RazonMovimiento);
            const userRepo = tem.getRepository(User);

            const producto = await productoRepo.findOne({
                where: { id_producto: id_producto_fk },
                relations: ["unidad_medida_primaria", "unidad_conteo_alternativa"]
            });
            if (!producto) throw new Error("Producto no encontrado.");

            const ubicacion = await ubicacionRepo.findOneBy({ id_ubicacion: id_ubicacion_fk });
            if (!ubicacion) throw new Error("Ubicación no encontrada.");

            const tipoMovimiento = await tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: id_tipo_movimiento_fk });
            if (!tipoMovimiento || tipoMovimiento.efecto_stock !== 1) {
                throw new Error("Tipo de movimiento inválido para una entrada.");
            }

            const unidadMovimiento = await unidadMedidaRepo.findOneBy({ id_unidad_medida: id_unidad_medida_movimiento_fk });
            if (!unidadMovimiento) throw new Error("Unidad de medida del movimiento no encontrada.");

            // Lógica de conversión de unidades
            let cantidadConvertidaAPrimaria: number;
            const cantidadNum = Number(cantidad_movida);

            if (unidadMovimiento.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                cantidadConvertidaAPrimaria = cantidadNum;
            } else if (producto.unidad_conteo_alternativa && 
                       unidadMovimiento.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && 
                       producto.cantidad_por_unidad_alternativa) {
                cantidadConvertidaAPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
            } else {
                throw new Error("La unidad de medida del movimiento no es válida para este producto.");
            }

            if (cantidadConvertidaAPrimaria <= 0) {
                throw new Error("La cantidad debe ser mayor a cero.");
            }

            // Buscar o crear el registro de stock para este producto en esta ubicación
            let stockEnUbicacion = await stockProductoRepo.findOneBy({ id_producto_fk, id_ubicacion_fk });

            if (!stockEnUbicacion) {
                stockEnUbicacion = stockProductoRepo.create({
                    id_producto_fk,
                    id_ubicacion_fk,
                    cantidad: 0
                });
            }

            const stockAnteriorTotal = producto.stock_actual;

            // Actualizar cantidades
            stockEnUbicacion.cantidad += cantidadConvertidaAPrimaria;
            producto.stock_actual += cantidadConvertidaAPrimaria;

            // Guardar los cambios en el stock
            await tem.save(stockEnUbicacion);
            await tem.save(producto);

            // Obtener usuario
            const usuario = await userRepo.findOneBy({ id_usuario: id_usuario_fk });
            if (!usuario) throw new Error("Usuario no encontrado.");

            // Crear y guardar el movimiento
            const nuevoMovimiento = new MovimientoInventario();
            nuevoMovimiento.producto = producto;
            nuevoMovimiento.tipo_movimiento = tipoMovimiento;
            nuevoMovimiento.cantidad_movida = cantidadNum;
            nuevoMovimiento.unidad_medida_movimiento = unidadMovimiento;
            nuevoMovimiento.cantidad_convertida_a_primaria = cantidadConvertidaAPrimaria;
            nuevoMovimiento.stock_anterior_primaria = stockAnteriorTotal;
            nuevoMovimiento.stock_nuevo_primaria = producto.stock_actual;
            nuevoMovimiento.usuario = usuario;
            nuevoMovimiento.ubicacion = ubicacion;
            nuevoMovimiento.referencia_documento = referencia_documento || null;
            nuevoMovimiento.notas_adicionales = notas_adicionales || null;

            // Asignar razón si se proporciona
            if (id_razon_movimiento_fk) {
                const razon = await razonMovimientoRepo.findOneBy({ id_razon_movimiento: id_razon_movimiento_fk });
                if (razon) {
                    nuevoMovimiento.razon_movimiento = razon;
                }
            }

            await tem.save(nuevoMovimiento);

            res.status(201).json({ 
                message: "Entrada registrada exitosamente.", 
                productoActualizado: producto,
                movimiento: nuevoMovimiento 
            });
            return;
        } catch (error) {
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                } else {
                    res.status(500).json({ message: "Error desconocido al procesar la entrada." });
                }
            }
        }
    });
};

export const registrarSalidaBaja = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        id_producto_fk,
        cantidad_movida,
        id_unidad_medida_movimiento_fk,
        id_tipo_movimiento_fk,
        id_ubicacion_fk,
        id_razon_movimiento_fk,
        referencia_documento,
        notas_adicionales,
        id_solicitud_reserva_detalle_fk
    } = req.body;

    const id_usuario_fk = req.user!.id;

    if (!id_producto_fk || cantidad_movida === undefined || !id_unidad_medida_movimiento_fk || !id_tipo_movimiento_fk || !id_ubicacion_fk) {
        res.status(400).json({ message: "Producto, cantidad, unidad de medida del movimiento, tipo de movimiento y ubicación son requeridos." });
        return;
    }
    
    if (Number(cantidad_movida) <= 0) {
        res.status(400).json({ message: "La cantidad movida debe ser mayor a cero." });
        return;
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const ubicacionRepository = transactionalEntityManager.getRepository(Ubicacion);
            const stockProductoRepository = transactionalEntityManager.getRepository(StockProducto);
            const unidadMedidaRepository = transactionalEntityManager.getRepository(UnidadMedida);
            const tipoMovimientoRepository = transactionalEntityManager.getRepository(TipoMovimiento);
            const razonMovimientoRepository = transactionalEntityManager.getRepository(RazonMovimiento);
            const movimientoRepository = transactionalEntityManager.getRepository(MovimientoInventario);
            const userRepository = transactionalEntityManager.getRepository(User);
            const detalleSolicitudRepository = transactionalEntityManager.getRepository(DetalleSolicitudReserva);

            const producto = await productoRepository.findOne({
                where: { id_producto: id_producto_fk },
                relations: ["unidad_medida_primaria", "unidad_conteo_alternativa"]
            });
            if (!producto) throw new Error(`Producto con ID ${id_producto_fk} no encontrado.`);

            const ubicacion = await ubicacionRepository.findOneBy({ id_ubicacion: id_ubicacion_fk });
            if (!ubicacion) throw new Error("Ubicación no encontrada.");

            const unidadMovimiento = await unidadMedidaRepository.findOneBy({ id_unidad_medida: id_unidad_medida_movimiento_fk });
            if (!unidadMovimiento) throw new Error(`Unidad de medida del movimiento con ID ${id_unidad_medida_movimiento_fk} no encontrada.`);

            const tipoMovimiento = await tipoMovimientoRepository.findOneBy({ id_tipo_movimiento: id_tipo_movimiento_fk });
            if (!tipoMovimiento) throw new Error(`Tipo de movimiento con ID ${id_tipo_movimiento_fk} no encontrado.`);
            if (tipoMovimiento.efecto_stock !== -1) {
                throw new Error(`El tipo de movimiento '${tipoMovimiento.nombre_tipo}' no es válido para una salida/baja de stock.`);
            }

            // Lógica de conversión de unidades
            let cantidadConvertidaAPrimaria: number;
            const cantidadNum = Number(cantidad_movida);

            if (unidadMovimiento.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                cantidadConvertidaAPrimaria = cantidadNum;
            } else if (producto.unidad_conteo_alternativa && 
                       unidadMovimiento.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && 
                       producto.cantidad_por_unidad_alternativa) {
                cantidadConvertidaAPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
            } else {
                throw new Error(`La unidad de medida '${unidadMovimiento.nombre_unidad}' no es válida para registrar movimientos de este producto o falta configuración de unidad alternativa.`);
            }

            if (cantidadConvertidaAPrimaria <= 0) {
                throw new Error("La cantidad convertida a la unidad primaria debe ser mayor a cero.");
            }

            // Verificar stock en la ubicación específica
            const stockEnUbicacion = await stockProductoRepository.findOneBy({ id_producto_fk, id_ubicacion_fk });
            if (!stockEnUbicacion || stockEnUbicacion.cantidad < cantidadConvertidaAPrimaria) {
                throw new Error(`Stock insuficiente en la ubicación '${ubicacion.nombre}'. Stock actual en ubicación: ${stockEnUbicacion?.cantidad || 0}, se intentan sacar: ${cantidadConvertidaAPrimaria}.`);
            }

            const stockAnteriorTotal = producto.stock_actual;
            const stockNuevoPrimaria = stockAnteriorTotal - cantidadConvertidaAPrimaria;

            // Validación adicional de stock total
            if (stockNuevoPrimaria < 0) {
                throw new Error(`Stock total insuficiente para el producto '${producto.nombre_producto}'. Stock actual: ${stockAnteriorTotal}, se intentan sacar: ${cantidadConvertidaAPrimaria} (en unidad primaria).`);
            }

            // Actualizar cantidades
            stockEnUbicacion.cantidad -= cantidadConvertidaAPrimaria;
            producto.stock_actual = stockNuevoPrimaria;

            await transactionalEntityManager.save(stockEnUbicacion);
            await transactionalEntityManager.save(producto);

            const usuario = await userRepository.findOneBy({ id_usuario: id_usuario_fk });
            if (!usuario) throw new Error("Usuario no encontrado.");

            // Crear el movimiento
            const nuevoMovimiento = new MovimientoInventario();
            nuevoMovimiento.producto = producto;
            nuevoMovimiento.tipo_movimiento = tipoMovimiento;
            nuevoMovimiento.cantidad_movida = cantidadNum;
            nuevoMovimiento.unidad_medida_movimiento = unidadMovimiento;
            nuevoMovimiento.cantidad_convertida_a_primaria = cantidadConvertidaAPrimaria;
            nuevoMovimiento.stock_anterior_primaria = stockAnteriorTotal;
            nuevoMovimiento.stock_nuevo_primaria = stockNuevoPrimaria;
            nuevoMovimiento.usuario = usuario;
            nuevoMovimiento.ubicacion = ubicacion;
            nuevoMovimiento.referencia_documento = referencia_documento || null;
            nuevoMovimiento.notas_adicionales = notas_adicionales || null;
            
            // Enlazar con DetalleSolicitudReserva si se proporciona el ID
            if (id_solicitud_reserva_detalle_fk) {
                const detalleSolicitud = await detalleSolicitudRepository.findOneBy({ id_detalle_solicitud: id_solicitud_reserva_detalle_fk });
                if (!detalleSolicitud) {
                    throw new Error(`Detalle de solicitud de reserva con ID ${id_solicitud_reserva_detalle_fk} no encontrado.`);
                }
                nuevoMovimiento.detalle_solicitud_reserva = detalleSolicitud;
            } else {
                nuevoMovimiento.detalle_solicitud_reserva = null;
            }

            // Asignar razón si se proporciona
            if (id_razon_movimiento_fk) {
                const razon = await razonMovimientoRepository.findOneBy({ id_razon_movimiento: id_razon_movimiento_fk });
                if (!razon) throw new Error(`Razón de movimiento con ID ${id_razon_movimiento_fk} no encontrada.`);
                nuevoMovimiento.razon_movimiento = razon;
            }

            await transactionalEntityManager.save(MovimientoInventario, nuevoMovimiento);

            res.status(201).json({ 
                message: "Salida/Baja de stock registrada exitosamente.", 
                movimiento: nuevoMovimiento, 
                productoActualizado: producto 
            });
            return;

        } catch (error) {
            console.error("Error en transacción de registrarSalidaBaja:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    // Si el error es por stock insuficiente, podría ser un 409 Conflict
                    if (error.message.includes('Stock insuficiente')) {
                        res.status(409).json({ message: error.message });
                    } else {
                        res.status(400).json({ message: error.message });
                    }
                } else {
                    res.status(500).json({ message: "Error desconocido al procesar la salida/baja de stock." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en registrarSalidaBaja:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Falló la transacción al registrar salida/baja.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Falló la transacción al registrar salida/baja con error desconocido." });
            }
        }
    });
};