// server/src/controllers/movimiento.controller.ts

import { Response,Request } from "express";
import { AppDataSource } from "../data-source";
import { Producto } from "../entities/Producto";
import { UnidadMedida } from "../entities/UnidadMedida";
import { TipoMovimiento } from "../entities/TipoMovimiento";
import { RazonMovimiento } from "../entities/RazonMovimiento";
import { MovimientoInventario } from "../entities/MovimientoInventario";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DetalleSolicitudReserva } from "../entities/DetalleSolicitudReserva";
import { User } from "../entities/User";


export const registrarEntrada = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        id_producto_fk,
        cantidad_movida, // Cantidad en la unidad de medida del movimiento
        id_unidad_medida_movimiento_fk, // ID de la UnidadMedida en que se hizo el movimiento
        id_tipo_movimiento_fk, // Debe ser un tipo de ENTRADA (efecto_stock = 1)
        id_razon_movimiento_fk, // Opcional
        referencia_documento, // Opcional
        notas_adicionales // Opcional
    } = req.body;

    const id_usuario_fk = req.user!.id; // Sabemos que req.user existe gracias a checkAuth

    // Validaciones básicas
    if (!id_producto_fk || cantidad_movida === undefined || !id_unidad_medida_movimiento_fk || !id_tipo_movimiento_fk) {
        res.status(400).json({ message: "Producto, cantidad, unidad de medida del movimiento y tipo de movimiento son requeridos." });
        return;
    }
    if (Number(cantidad_movida) <= 0) {
        res.status(400).json({ message: "La cantidad movida debe ser mayor a cero." });
        return;
    }

    // Usaremos una transacción para asegurar la atomicidad de las operaciones
    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const unidadMedidaRepository = transactionalEntityManager.getRepository(UnidadMedida);
            const tipoMovimientoRepository = transactionalEntityManager.getRepository(TipoMovimiento);
            const razonMovimientoRepository = transactionalEntityManager.getRepository(RazonMovimiento);
            const movimientoRepository = transactionalEntityManager.getRepository(MovimientoInventario);
            const userRepository = transactionalEntityManager.getRepository(User);

            // 1. Obtener el producto y sus unidades relacionadas
            const producto = await productoRepository.findOne({
                where: { id_producto: id_producto_fk },
                relations: ["unidad_medida_primaria", "unidad_conteo_alternativa"]
            });
            if (!producto) {
                // Lanzar error para que el catch de la transacción lo maneje
                throw new Error(`Producto con ID ${id_producto_fk} no encontrado.`);
            }

            // 2. Obtener la unidad de medida del movimiento
            const unidadMovimiento = await unidadMedidaRepository.findOneBy({ id_unidad_medida: id_unidad_medida_movimiento_fk });
            if (!unidadMovimiento) {
                throw new Error(`Unidad de medida del movimiento con ID ${id_unidad_medida_movimiento_fk} no encontrada.`);
            }

            // 3. Obtener el tipo de movimiento y verificar que sea de entrada
            const tipoMovimiento = await tipoMovimientoRepository.findOneBy({ id_tipo_movimiento: id_tipo_movimiento_fk });
            if (!tipoMovimiento) {
                throw new Error(`Tipo de movimiento con ID ${id_tipo_movimiento_fk} no encontrado.`);
            }
            if (tipoMovimiento.efecto_stock !== 1) {
                throw new Error(`El tipo de movimiento '${tipoMovimiento.nombre_tipo}' no es válido para una entrada de stock.`);
            }

            // 4. Calcular cantidad_convertida_a_primaria
            let cantidadConvertidaAPrimaria: number;
            const cantidadNum = Number(cantidad_movida);

            if (unidadMovimiento.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                cantidadConvertidaAPrimaria = cantidadNum;
            } else if (producto.unidad_conteo_alternativa && unidadMovimiento.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && producto.cantidad_por_unidad_alternativa) {
                cantidadConvertidaAPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
            } else {
                throw new Error(`La unidad de medida '${unidadMovimiento.nombre_unidad}' no es válida para registrar movimientos de este producto o falta configuración de unidad alternativa.`);
            }

            if (cantidadConvertidaAPrimaria <= 0) {
                throw new Error("La cantidad convertida a la unidad primaria debe ser mayor a cero.");
            }

            // 5. Obtener stock anterior y calcular nuevo stock
            const stockAnteriorPrimaria = producto.stock_actual;
            const stockNuevoPrimaria = stockAnteriorPrimaria + cantidadConvertidaAPrimaria;

            // 6. Crear y guardar el movimiento de inventario
            const usuario = await userRepository.findOneBy({ id_usuario: id_usuario_fk });
            if (!usuario) throw new Error("Usuario no encontrado."); // No debería pasar si checkAuth funciona

            const nuevoMovimiento = new MovimientoInventario();
            nuevoMovimiento.producto = producto;
            nuevoMovimiento.fecha_movimiento = new Date(); // Se establece automáticamente por @CreateDateColumn
            nuevoMovimiento.tipo_movimiento = tipoMovimiento;
            nuevoMovimiento.cantidad_movida = cantidadNum;
            nuevoMovimiento.unidad_medida_movimiento = unidadMovimiento;
            nuevoMovimiento.cantidad_convertida_a_primaria = cantidadConvertidaAPrimaria;
            nuevoMovimiento.stock_anterior_primaria = stockAnteriorPrimaria;
            nuevoMovimiento.stock_nuevo_primaria = stockNuevoPrimaria;
            nuevoMovimiento.usuario = usuario;
            nuevoMovimiento.referencia_documento = referencia_documento || null;
            nuevoMovimiento.notas_adicionales = notas_adicionales || null;

            if (id_razon_movimiento_fk) {
                const razon = await razonMovimientoRepository.findOneBy({ id_razon_movimiento: id_razon_movimiento_fk });
                if (!razon) throw new Error(`Razón de movimiento con ID ${id_razon_movimiento_fk} no encontrada.`);
                nuevoMovimiento.razon_movimiento = razon;
            }

            await transactionalEntityManager.save(MovimientoInventario, nuevoMovimiento);

            // 7. Actualizar el stock del producto
            producto.stock_actual = stockNuevoPrimaria;
            await transactionalEntityManager.save(Producto, producto);

            res.status(201).json({ message: "Entrada de stock registrada exitosamente.", movimiento: nuevoMovimiento, productoActualizado: producto });
            return;

        } catch (error) {
            console.error("Error en transacción de registrarEntrada:", error);
            // La transacción se revierte automáticamente si se lanza un error dentro de ella.
            // Es importante que el res.status().json() esté fuera del callback de la transacción
            // o que el error se propague para ser manejado por un error handler global si lo tuvieras.
            // Por ahora, para que el cliente reciba una respuesta, necesitamos manejarlo aquí.
            if (error instanceof Error) {
                // Evitar enviar múltiples respuestas si ya se envió una
                if (!res.headersSent) {
                    res.status(400).json({ message: error.message || "Error al procesar la entrada de stock." });
                }
            } else if (!res.headersSent) {
                res.status(500).json({ message: "Error desconocido al procesar la entrada de stock." });
            }
            // No añadir un return explícito aquí si queremos que el error se propague y la transacción se revierta
            // pero como estamos enviando la respuesta, podemos terminar aquí.
            // Si el res.status().json() estuviera DENTRO del try/catch, y luego un return,
            // el catch no se ejecutaría si el error es en el save.
            // La clave es que la transacción se revierte si la promesa que devuelve se rechaza.
        }
    }).catch(transactionError => {
        // Este catch es para errores que ocurren al INICIAR o CONFIRMAR la transacción en sí,
        // o si un error se propaga desde dentro del callback de la transacción sin ser capturado y respondido.
        console.error("Error de la transacción general en registrarEntrada:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al registrar entrada.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al registrar entrada con error desconocido." });
            }
        }
    });
};
// server/src/controllers/movimiento.controller.ts
// ... (imports y la función registrarEntrada que ya tienes) ...

// --- AÑADE ESTA NUEVA FUNCIÓN ---
export const registrarSalidaBaja = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        id_producto_fk,
        cantidad_movida,
        id_unidad_medida_movimiento_fk,
        id_tipo_movimiento_fk, // Debe ser un tipo de SALIDA/BAJA (efecto_stock = -1)
        id_razon_movimiento_fk,
        referencia_documento,
        notas_adicionales,
        id_solicitud_reserva_detalle_fk // Si esta salida está ligada a una reserva
    } = req.body;

    const id_usuario_fk = req.user!.id;

    if (!id_producto_fk || cantidad_movida === undefined || !id_unidad_medida_movimiento_fk || !id_tipo_movimiento_fk) {
        res.status(400).json({ message: "Producto, cantidad, unidad de medida del movimiento y tipo de movimiento son requeridos." });
        return;
    }
    if (Number(cantidad_movida) <= 0) {
        res.status(400).json({ message: "La cantidad movida debe ser mayor a cero." });
        return;
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const unidadMedidaRepository = transactionalEntityManager.getRepository(UnidadMedida);
            const tipoMovimientoRepository = transactionalEntityManager.getRepository(TipoMovimiento);
            const razonMovimientoRepository = transactionalEntityManager.getRepository(RazonMovimiento);
            const movimientoRepository = transactionalEntityManager.getRepository(MovimientoInventario);
            const userRepository = transactionalEntityManager.getRepository(User);
            // Si usamos id_solicitud_reserva_detalle_fk, necesitaríamos el repositorio de DetalleSolicitudReserva

            const producto = await productoRepository.findOne({
                where: { id_producto: id_producto_fk },
                relations: ["unidad_medida_primaria", "unidad_conteo_alternativa"]
            });
            if (!producto) throw new Error(`Producto con ID ${id_producto_fk} no encontrado.`);

            const unidadMovimiento = await unidadMedidaRepository.findOneBy({ id_unidad_medida: id_unidad_medida_movimiento_fk });
            if (!unidadMovimiento) throw new Error(`Unidad de medida del movimiento con ID ${id_unidad_medida_movimiento_fk} no encontrada.`);

            const tipoMovimiento = await tipoMovimientoRepository.findOneBy({ id_tipo_movimiento: id_tipo_movimiento_fk });
            if (!tipoMovimiento) throw new Error(`Tipo de movimiento con ID ${id_tipo_movimiento_fk} no encontrado.`);
            if (tipoMovimiento.efecto_stock !== -1) { // VALIDACIÓN CLAVE PARA SALIDAS
                throw new Error(`El tipo de movimiento '${tipoMovimiento.nombre_tipo}' no es válido para una salida/baja de stock.`);
            }

            let cantidadConvertidaAPrimaria: number;
            const cantidadNum = Number(cantidad_movida);

            if (unidadMovimiento.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                cantidadConvertidaAPrimaria = cantidadNum;
            } else if (producto.unidad_conteo_alternativa && unidadMovimiento.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && producto.cantidad_por_unidad_alternativa) {
                cantidadConvertidaAPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
            } else {
                throw new Error(`La unidad de medida '${unidadMovimiento.nombre_unidad}' no es válida para registrar movimientos de este producto o falta configuración de unidad alternativa.`);
            }

            if (cantidadConvertidaAPrimaria <= 0) {
                throw new Error("La cantidad convertida a la unidad primaria debe ser mayor a cero.");
            }

            const stockAnteriorPrimaria = producto.stock_actual;
            const stockNuevoPrimaria = stockAnteriorPrimaria - cantidadConvertidaAPrimaria; // RESTAMOS

            // VALIDACIÓN DE STOCK SUFICIENTE
            if (stockNuevoPrimaria < 0) {
                throw new Error(`Stock insuficiente para el producto '${producto.nombre_producto}'. Stock actual: ${stockAnteriorPrimaria}, se intentan sacar: ${cantidadConvertidaAPrimaria} (en unidad primaria).`);
            }

            const usuario = await userRepository.findOneBy({ id_usuario: id_usuario_fk });
            if (!usuario) throw new Error("Usuario no encontrado.");

            const nuevoMovimiento = new MovimientoInventario();
            nuevoMovimiento.producto = producto;
            nuevoMovimiento.tipo_movimiento = tipoMovimiento;
            nuevoMovimiento.cantidad_movida = cantidadNum;
            nuevoMovimiento.unidad_medida_movimiento = unidadMovimiento;
            nuevoMovimiento.cantidad_convertida_a_primaria = cantidadConvertidaAPrimaria;
            nuevoMovimiento.stock_anterior_primaria = stockAnteriorPrimaria;
            nuevoMovimiento.stock_nuevo_primaria = stockNuevoPrimaria;
            nuevoMovimiento.usuario = usuario;
            nuevoMovimiento.referencia_documento = referencia_documento || null;
            nuevoMovimiento.notas_adicionales = notas_adicionales || null;
            
            // Enlazar con DetalleSolicitudReserva si se proporciona el ID
            if (id_solicitud_reserva_detalle_fk) {
                // Aquí necesitaríamos cargar la entidad DetalleSolicitudReserva
                const detalleSolicitudRepository = transactionalEntityManager.getRepository(DetalleSolicitudReserva); // <--- AÑADE ESTO

                // ... (código para crear nuevoMovimiento y asignar otras propiedades) ...
                nuevoMovimiento.producto = producto;
                // ... (otras asignaciones) ...

                // Enlazar con DetalleSolicitudReserva si se proporciona el ID
                if (id_solicitud_reserva_detalle_fk) {
                    const detalleSolicitud = await detalleSolicitudRepository.findOneBy({ id_detalle_solicitud: id_solicitud_reserva_detalle_fk });
                    if (!detalleSolicitud) {
                        // Es importante decidir cómo manejar esto: ¿error o simplemente no se enlaza?
                        // Por ahora, lanzaremos un error si se proporciona un ID pero no se encuentra el detalle.
                        throw new Error(`Detalle de solicitud de reserva con ID ${id_solicitud_reserva_detalle_fk} no encontrado.`);
                    }
                    nuevoMovimiento.detalle_solicitud_reserva = detalleSolicitud; // <--- ASIGNAMOS EL OBJETO COMPLETO
                } else {
                    nuevoMovimiento.detalle_solicitud_reserva = null;
                }
            }


            if (id_razon_movimiento_fk) {
                const razon = await razonMovimientoRepository.findOneBy({ id_razon_movimiento: id_razon_movimiento_fk });
                if (!razon) throw new Error(`Razón de movimiento con ID ${id_razon_movimiento_fk} no encontrada.`);
                nuevoMovimiento.razon_movimiento = razon;
            }

            await transactionalEntityManager.save(MovimientoInventario, nuevoMovimiento);

            producto.stock_actual = stockNuevoPrimaria;
            await transactionalEntityManager.save(Producto, producto);

            res.status(201).json({ message: "Salida/Baja de stock registrada exitosamente.", movimiento: nuevoMovimiento, productoActualizado: producto });
            return;

        } catch (error) {
            console.error("Error en transacción de registrarSalidaBaja:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    // Si el error es por stock insuficiente, podría ser un 409 Conflict
                    if (error.message.startsWith('Stock insuficiente')) {
                        res.status(409).json({ message: error.message });
                    } else {
                        res.status(400).json({ message: error.message || "Error al procesar la salida/baja de stock." });
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
                res.status(500).json({ message: "Fallo la transacción al registrar salida/baja.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al registrar salida/baja con error desconocido." });
            }
        }
    });
};
export const getAllMovimientos = async (req: Request, res: Response): Promise<void> => {
    // Para el futuro, podríamos leer filtros desde req.query, por ejemplo: /api/movimientos?id_producto_fk=2
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