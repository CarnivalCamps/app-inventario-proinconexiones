// server/src/controllers/solicitud.controller.ts

import { Response } from "express";
import { AppDataSource } from "../data-source";
import { SolicitudReserva } from "../entities/SolicitudReserva";
import { DetalleSolicitudReserva } from "../entities/DetalleSolicitudReserva";
import { Producto } from "../entities/Producto";
import { UnidadMedida } from "../entities/UnidadMedida";
import { User } from "../entities/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MovimientoInventario } from "../entities/MovimientoInventario";
import { TipoMovimiento } from "../entities/TipoMovimiento";
import { StockProducto } from "../entities/StockProducto";
import { Ubicacion } from "../entities/Ubicacion";

interface DetalleSolicitudInput {
    id_producto_fk: number;
    cantidad_solicitada: number;
    id_unidad_medida_solicitada_fk: number;
    // Podríamos añadir precio_unitario_venta_registrado aquí si el vendedor lo define
}

interface CreateSolicitudReservaBody {
    proposito_solicitud: string;
    fecha_requerida_entrega?: string; // Opcional, formato YYYY-MM-DD
    justificacion_detallada?: string; // Opcional
    detalles: DetalleSolicitudInput[];
}

export const createSolicitudReserva = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        proposito_solicitud,
        fecha_requerida_entrega,
        justificacion_detallada,
        detalles
    }: CreateSolicitudReservaBody = req.body;

    const id_vendedor_fk = req.user!.id; // Usuario que crea la solicitud

    // Validaciones básicas
    if (!proposito_solicitud || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        res.status(400).json({ message: "Propósito y al menos un detalle de producto son requeridos." });
        return;
    }

    for (const detalle of detalles) {
        if (!detalle.id_producto_fk || detalle.cantidad_solicitada === undefined || Number(detalle.cantidad_solicitada) <= 0 || !detalle.id_unidad_medida_solicitada_fk) {
            res.status(400).json({ message: "Cada detalle debe incluir id_producto_fk, cantidad_solicitada (mayor a 0) e id_unidad_medida_solicitada_fk." });
            return;
        }
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const solicitudRepository = transactionalEntityManager.getRepository(SolicitudReserva);
            const detalleSolicitudRepository = transactionalEntityManager.getRepository(DetalleSolicitudReserva);
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const unidadMedidaRepository = transactionalEntityManager.getRepository(UnidadMedida);
            const userRepository = transactionalEntityManager.getRepository(User);

            const vendedor = await userRepository.findOneBy({ id_usuario: id_vendedor_fk });
            if (!vendedor) throw new Error("Usuario vendedor no encontrado."); // No debería pasar con checkAuth

            // 1. Crear la cabecera de la SolicitudReserva
            const nuevaSolicitud = new SolicitudReserva();
            nuevaSolicitud.proposito_solicitud = proposito_solicitud;
            nuevaSolicitud.vendedor = vendedor;
            nuevaSolicitud.estado_solicitud = 'Pendiente'; // Estado inicial
            if (fecha_requerida_entrega) nuevaSolicitud.fecha_requerida_entrega = new Date(fecha_requerida_entrega);
            if (justificacion_detallada) nuevaSolicitud.justificacion_detallada = justificacion_detallada;
            
            const solicitudGuardada = await transactionalEntityManager.save(SolicitudReserva, nuevaSolicitud);

            // 2. Crear los DetallesSolicitudReserva
            const detallesGuardados: DetalleSolicitudReserva[] = [];
            for (const item of detalles) {
                const producto = await productoRepository.findOne({
                    where: { id_producto: item.id_producto_fk },
                    relations: ['unidad_medida_primaria', 'unidad_conteo_alternativa']
                });
                if (!producto) throw new Error(`Producto con ID ${item.id_producto_fk} no encontrado.`);

                const unidadSolicitada = await unidadMedidaRepository.findOneBy({ id_unidad_medida: item.id_unidad_medida_solicitada_fk });
                if (!unidadSolicitada) throw new Error(`Unidad de medida con ID ${item.id_unidad_medida_solicitada_fk} no encontrada.`);

                let cantidadConvertidaAPrimaria: number;
                const cantidadNum = Number(item.cantidad_solicitada);

                if (unidadSolicitada.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                    cantidadConvertidaAPrimaria = cantidadNum;
                } else if (producto.unidad_conteo_alternativa && unidadSolicitada.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && producto.cantidad_por_unidad_alternativa) {
                    cantidadConvertidaAPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
                } else {
                    throw new Error(`La unidad de medida '${unidadSolicitada.nombre_unidad}' no es válida para el producto '${producto.nombre_producto}'.`);
                }
                if (cantidadConvertidaAPrimaria <= 0) throw new Error("La cantidad solicitada (convertida a primaria) debe ser mayor a cero.");

                const nuevoDetalle = new DetalleSolicitudReserva();
                nuevoDetalle.solicitud_reserva = solicitudGuardada;
                nuevoDetalle.producto = producto;
                nuevoDetalle.cantidad_solicitada = cantidadNum;
                nuevoDetalle.unidad_medida_solicitada = unidadSolicitada;
                nuevoDetalle.cantidad_solicitada_convertida_a_primaria = cantidadConvertidaAPrimaria;
                // Opcional: Capturar stock disponible en este momento
                nuevoDetalle.stock_disponible_al_solicitar_primaria = producto.stock_actual; 

                await transactionalEntityManager.save(DetalleSolicitudReserva, nuevoDetalle);
                detallesGuardados.push(nuevoDetalle);
            }
            
            // Devolver la solicitud completa con sus detalles (podemos recargarla o construirla)
            // Recargarla es más seguro para obtener todos los campos por defecto y relaciones cargadas si eager:true
            const solicitudCompleta = await solicitudRepository.findOne({
                where: { id_solicitud: solicitudGuardada.id_solicitud },
                relations: [
                    "vendedor", 
                    "almacenista_procesa",
                    "detalles_solicitud", 
                    "detalles_solicitud.producto",
                    "detalles_solicitud.unidad_medida_solicitada"
                ]
            });

            res.status(201).json(solicitudCompleta);
            return;

        } catch (error) {
            console.error("Error en transacción de createSolicitudReserva:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al crear la solicitud de reserva." });
                } else {
                    res.status(500).json({ message: "Error desconocido al crear la solicitud de reserva." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en createSolicitudReserva:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al crear solicitud.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al crear solicitud con error desconocido." });
            }
        }
    });
};

export const getAllSolicitudes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const solicitudRepository = AppDataSource.getRepository(SolicitudReserva);
        const solicitudes = await solicitudRepository.find({
            relations: [
                "vendedor", // Carga la info básica del vendedor
                // "vendedor.rol", // Si también quieres el rol del vendedor
                "almacenista_procesa", // Carga la info del almacenista si ya fue procesada
                "detalles_solicitud", // Carga los detalles de la solicitud
                "detalles_solicitud.producto", // Dentro de cada detalle, carga el producto
                "detalles_solicitud.unidad_medida_solicitada" // Y la unidad de medida solicitada
            ],
            order: {
                fecha_solicitud: "DESC" // Ordenar por fecha de solicitud, las más nuevas primero
            }
            // Aquí podríamos añadir filtros por estado, vendedor, etc. usando req.query en el futuro
        });

        res.status(200).json(solicitudes);
        return;
    } catch (error) {
        console.error("Error en getAllSolicitudes:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener las solicitudes de reserva.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener las solicitudes de reserva." });
        return;
    }
};

// --- NUEVA FUNCIÓN ---
export const getSolicitudById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const solicitudRepository = AppDataSource.getRepository(SolicitudReserva);
        const solicitud = await solicitudRepository.findOne({
            where: { id_solicitud: parseInt(id) },
            relations: [
                "vendedor",
                // "vendedor.rol",
                "almacenista_procesa",
                "detalles_solicitud",
                "detalles_solicitud.producto",
                "detalles_solicitud.producto.unidad_medida_primaria", // Para ver más detalles del producto
                "detalles_solicitud.producto.categoria", // Y su categoría
                "detalles_solicitud.unidad_medida_solicitada"
            ]
        });

        if (!solicitud) {
            res.status(404).json({ message: "Solicitud de reserva no encontrada." });
            return;
        }
        res.status(200).json(solicitud);
        return;
    } catch (error) {
        console.error("Error en getSolicitudById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener la solicitud de reserva.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener la solicitud de reserva." });
        return;
    }
};

interface DetalleAprobadoInput {
    id_detalle_solicitud: number;
    cantidad_aprobada_primaria: number;
}

interface AprobarSolicitudBody {
    notas_almacenista?: string;
    detalles_aprobados: DetalleAprobadoInput[]; // El almacenero indica qué cantidad aprueba por cada ítem
}

export const aprobarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: idSolicitud } = req.params; // ID de la SolicitudReserva
    const { notas_almacenista, detalles_aprobados }: AprobarSolicitudBody = req.body;
    const id_almacenista_fk = req.user!.id;

    if (!detalles_aprobados || !Array.isArray(detalles_aprobados) || detalles_aprobados.length === 0) {
        res.status(400).json({ message: "Se requiere la información de los detalles aprobados." });
        return;
    }

    for (const detalle of detalles_aprobados) {
        if (detalle.id_detalle_solicitud === undefined || detalle.cantidad_aprobada_primaria === undefined || Number(detalle.cantidad_aprobada_primaria) < 0) {
            res.status(400).json({ message: "Cada detalle aprobado debe incluir id_detalle_solicitud y cantidad_aprobada_primaria (no negativa)." });
            return;
        }
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const solicitudRepository = transactionalEntityManager.getRepository(SolicitudReserva);
            const detalleSolicitudRepository = transactionalEntityManager.getRepository(DetalleSolicitudReserva);
            const userRepository = transactionalEntityManager.getRepository(User);

            const solicitud = await solicitudRepository.findOne({
                where: { id_solicitud: parseInt(idSolicitud) },
                relations: ["detalles_solicitud", "detalles_solicitud.producto"] // Cargar detalles y productos
            });

            if (!solicitud) throw new Error(`Solicitud de reserva con ID ${idSolicitud} no encontrada.`);
            if (solicitud.estado_solicitud !== 'Pendiente') {
                throw new Error(`La solicitud ya ha sido procesada (estado actual: ${solicitud.estado_solicitud}).`);
            }

            const almacenista = await userRepository.findOneBy({ id_usuario: id_almacenista_fk });
            if (!almacenista) throw new Error("Usuario almacenista no encontrado.");

            let todosLosItemsCompletamenteAprobados = true;
            let algunItemAprobado = false;

            for (const detalleAprobado of detalles_aprobados) {
                const detalleOriginal = solicitud.detalles_solicitud.find(d => d.id_detalle_solicitud === detalleAprobado.id_detalle_solicitud);
                if (!detalleOriginal) throw new Error(`Detalle de solicitud con ID ${detalleAprobado.id_detalle_solicitud} no pertenece a esta solicitud.`);

                if (Number(detalleAprobado.cantidad_aprobada_primaria) > detalleOriginal.cantidad_solicitada_convertida_a_primaria) {
                    throw new Error(`La cantidad aprobada (${detalleAprobado.cantidad_aprobada_primaria}) para el producto '${detalleOriginal.producto.nombre_producto}' no puede exceder la cantidad solicitada (${detalleOriginal.cantidad_solicitada_convertida_a_primaria}).`);
                }
                // Aquí se podría añadir una verificación contra el stock_actual del producto si la lógica de negocio lo requiere
                // if (Number(detalleAprobado.cantidad_aprobada_primaria) > detalleOriginal.producto.stock_actual) {
                //     throw new Error(`Stock insuficiente para aprobar la cantidad deseada del producto '${detalleOriginal.producto.nombre_producto}'. Solicitado: ${detalleAprobado.cantidad_aprobada_primaria}, Disponible: ${detalleOriginal.producto.stock_actual}`);
                // }

                detalleOriginal.cantidad_aprobada_primaria = Number(detalleAprobado.cantidad_aprobada_primaria);
                await transactionalEntityManager.save(DetalleSolicitudReserva, detalleOriginal);

                if (detalleOriginal.cantidad_aprobada_primaria < detalleOriginal.cantidad_solicitada_convertida_a_primaria) {
                    todosLosItemsCompletamenteAprobados = false;
                }
                if (detalleOriginal.cantidad_aprobada_primaria > 0) {
                    algunItemAprobado = true;
                }
            }
            
            if (!algunItemAprobado && detalles_aprobados.every(d => d.cantidad_aprobada_primaria === 0)) {
                // Si todas las cantidades aprobadas son 0, es un rechazo de facto.
                solicitud.estado_solicitud = 'Rechazada';
                solicitud.razon_rechazo = notas_almacenista || "Todos los ítems fueron aprobados con cantidad cero.";
            } else if (todosLosItemsCompletamenteAprobados) {
                solicitud.estado_solicitud = 'Aprobada';
            } else {
                solicitud.estado_solicitud = 'Parcialmente Aprobada';
            }

            solicitud.almacenista_procesa = almacenista;
            solicitud.fecha_procesamiento = new Date();
            if (notas_almacenista) solicitud.notas_almacenista = notas_almacenista;

            await transactionalEntityManager.save(SolicitudReserva, solicitud);

            // Recargar para devolver el objeto completo
            const solicitudActualizada = await solicitudRepository.findOne({
                where: { id_solicitud: parseInt(idSolicitud) },
                relations: ["vendedor", "almacenista_procesa", "detalles_solicitud", "detalles_solicitud.producto", "detalles_solicitud.unidad_medida_solicitada"]
            });

            res.status(200).json(solicitudActualizada);
            return;

        } catch (error) {
            console.error("Error en transacción de aprobarSolicitud:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al aprobar la solicitud." });
                } else {
                    res.status(500).json({ message: "Error desconocido al aprobar la solicitud." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en aprobarSolicitud:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al aprobar solicitud.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al aprobar solicitud con error desconocido." });
            }
        }
    });
};

export const rechazarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: idSolicitud } = req.params;
    const { razon_rechazo, notas_almacenista } = req.body;
    const id_almacenista_fk = req.user!.id;

    if (!razon_rechazo) {
        res.status(400).json({ message: "Se requiere una razón para el rechazo." });
        return;
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const solicitudRepository = transactionalEntityManager.getRepository(SolicitudReserva);
            const userRepository = transactionalEntityManager.getRepository(User);

            const solicitud = await solicitudRepository.findOneBy({ id_solicitud: parseInt(idSolicitud) });

            if (!solicitud) throw new Error(`Solicitud de reserva con ID ${idSolicitud} no encontrada.`);
            if (solicitud.estado_solicitud !== 'Pendiente') {
                throw new Error(`La solicitud ya ha sido procesada (estado actual: ${solicitud.estado_solicitud}). No se puede rechazar.`);
            }

            const almacenista = await userRepository.findOneBy({ id_usuario: id_almacenista_fk });
            if (!almacenista) throw new Error("Usuario almacenista no encontrado.");

            solicitud.estado_solicitud = 'Rechazada';
            solicitud.razon_rechazo = razon_rechazo;
            solicitud.almacenista_procesa = almacenista;
            solicitud.fecha_procesamiento = new Date();
            if (notas_almacenista) solicitud.notas_almacenista = notas_almacenista;
            
            // Al rechazar, las cantidades aprobadas de los detalles deberían ser 0 o no aplicar.
            // Podríamos opcionalmente iterar los detalles y poner cantidad_aprobada_primaria = 0.
            // Por ahora, el cambio de estado es lo principal.

            await transactionalEntityManager.save(SolicitudReserva, solicitud);
            
            // Recargar para devolver el objeto completo
            const solicitudActualizada = await solicitudRepository.findOne({
                where: { id_solicitud: parseInt(idSolicitud) },
                relations: ["vendedor", "almacenista_procesa", "detalles_solicitud"] // Cargar relaciones necesarias
            });

            res.status(200).json(solicitudActualizada);
            return;

        } catch (error) {
            console.error("Error en transacción de rechazarSolicitud:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al rechazar la solicitud." });
                } else {
                    res.status(500).json({ message: "Error desconocido al rechazar la solicitud." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en rechazarSolicitud:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al rechazar solicitud.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al rechazar solicitud con error desconocido." });
            }
        }
    });
};

export const entregarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: idSolicitud } = req.params;
    const { id_ubicacion_origen, notas_entrega } = req.body;
    const id_almacenista_entrega_fk = req.user!.id;

    if (!id_ubicacion_origen) {
        res.status(400).json({ message: "Se requiere especificar la ubicación de origen para la entrega." });
        return;
    }

    await AppDataSource.manager.transaction(async (tem) => {
        try {
            const solicitudRepo = tem.getRepository(SolicitudReserva);
            const productoRepo = tem.getRepository(Producto);
            const stockProductoRepo = tem.getRepository(StockProducto);
            const ubicacionRepo = tem.getRepository(Ubicacion);
            const tipoMovRepo = tem.getRepository(TipoMovimiento);
            const usuarioRepo = tem.getRepository(User);

            const solicitud = await solicitudRepo.findOne({
                where: { id_solicitud: parseInt(idSolicitud) },
                relations: ["detalles_solicitud", "detalles_solicitud.producto", "detalles_solicitud.producto.unidad_medida_primaria"]
            });

            if (!solicitud) throw new Error(`Solicitud de reserva con ID ${idSolicitud} no encontrada.`);
            if (!['Aprobada', 'Parcialmente Aprobada'].includes(solicitud.estado_solicitud)) {
                throw new Error(`La solicitud no está en un estado válido para entrega.`);
            }

            const ubicacionOrigen = await ubicacionRepo.findOneBy({ id_ubicacion: id_ubicacion_origen });
            if (!ubicacionOrigen) throw new Error(`Ubicación de origen con ID ${id_ubicacion_origen} no encontrada.`);

            const almacenistaEntrega = await usuarioRepo.findOneBy({ id_usuario: id_almacenista_entrega_fk });
            if (!almacenistaEntrega) throw new Error("Usuario no encontrado.");

            const tipoMovSalida = await tipoMovRepo.findOneBy({ nombre_tipo: 'Salida por Venta' });
            if (!tipoMovSalida) throw new Error("Tipo de movimiento 'Salida por Venta' no encontrado.");

            for (const detalle of solicitud.detalles_solicitud) {
                if (detalle.cantidad_aprobada_primaria === null || detalle.cantidad_aprobada_primaria <= 0) continue;

                const cantidadAEntregar = detalle.cantidad_aprobada_primaria - detalle.cantidad_entregada_primaria;
                if (cantidadAEntregar <= 0) continue;

                const producto = detalle.producto;

                // VALIDACIÓN DE STOCK EN LA UBICACIÓN ESPECÍFICA
                const stockEnUbicacion = await stockProductoRepo.findOneBy({ id_producto_fk: producto.id_producto, id_ubicacion_fk: id_ubicacion_origen });
                if (!stockEnUbicacion || stockEnUbicacion.cantidad < cantidadAEntregar) {
                    throw new Error(`Stock insuficiente para '${producto.nombre_producto}' en la ubicación '${ubicacionOrigen.nombre}'. Necesario: ${cantidadAEntregar}, Disponible: ${stockEnUbicacion?.cantidad || 0}.`);
                }

                const stockAnteriorTotal = producto.stock_actual;

                // 1. Actualizar stock en la ubicación y el total del producto
                stockEnUbicacion.cantidad -= cantidadAEntregar;
                producto.stock_actual -= cantidadAEntregar;
                await tem.save(stockEnUbicacion);
                await tem.save(producto);

                // 2. Crear Movimiento de Inventario - AQUÍ ESTÁ LA CORRECCIÓN
                const movimiento = new MovimientoInventario();
                movimiento.producto = producto;
                movimiento.tipo_movimiento = tipoMovSalida;
                movimiento.cantidad_movida = cantidadAEntregar;
                movimiento.unidad_medida_movimiento = producto.unidad_medida_primaria; // <-- AGREGADO
                movimiento.cantidad_convertida_a_primaria = cantidadAEntregar;
                movimiento.stock_anterior_primaria = stockAnteriorTotal;
                movimiento.stock_nuevo_primaria = producto.stock_actual;
                movimiento.usuario = almacenistaEntrega;
                movimiento.ubicacion = ubicacionOrigen;
                movimiento.referencia_documento = `Solicitud #${solicitud.id_solicitud}`;
                movimiento.detalle_solicitud_reserva = detalle;
                if (notas_entrega) movimiento.notas_adicionales = notas_entrega;
                await tem.save(movimiento);

                // 3. Actualizar cantidad entregada en el detalle
                detalle.cantidad_entregada_primaria += cantidadAEntregar;
                await tem.save(detalle);
            }

            solicitud.estado_solicitud = 'Entregada';
            solicitud.fecha_entrega_efectiva = new Date();
            await tem.save(solicitud);

            res.status(200).json({ message: "Solicitud marcada como entregada y stock actualizado." });
            return;

        } catch (error) {
            if (!res.headersSent) {
                if (error instanceof Error) res.status(400).json({ message: error.message });
                else res.status(500).json({ message: "Error desconocido al procesar la entrega." });
            }
        }
    });
};