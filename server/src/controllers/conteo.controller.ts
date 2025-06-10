// server/src/controllers/conteo.controller.ts

import { Response } from "express";
import { AppDataSource } from "../data-source";
import { ConteoFisico } from "../entities/ConteoFisico";
import { User } from "../entities/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DetalleConteoFisico } from "../entities/DetalleConteoFisico";
import { Producto } from "../entities/Producto";
import { UnidadMedida } from "../entities/UnidadMedida";
// ... otros imports ...
import { MovimientoInventario } from "../entities/MovimientoInventario";
import { TipoMovimiento } from "../entities/TipoMovimiento";


export const getAllConteos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conteoRepository = AppDataSource.getRepository(ConteoFisico);
        const conteos = await conteoRepository.find({
            relations: ["usuario_responsable"],
            order: { fecha_inicio_conteo: "DESC" }
        });
        res.status(200).json(conteos);
        return;
    } catch (error) {
        console.error("Error en getAllConteos:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener los conteos.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener los conteos." });
        return;
    }
};

// --- FUNCIÓN PARA OBTENER UN CONTEO POR ID ---
export const getConteoById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { idConteo } = req.params;
    try {
        const conteoRepository = AppDataSource.getRepository(ConteoFisico);
        const conteo = await conteoRepository.findOne({
            where: { id_conteo: parseInt(idConteo) },
            relations: ["usuario_responsable", "detalles_conteo", "detalles_conteo.producto", "detalles_conteo.unidad_medida_conteo", "detalles_conteo.movimiento_ajuste"]
        });

        if (!conteo) {
            res.status(404).json({ message: `Conteo Físico con ID ${idConteo} no encontrado.` });
            return;
        }
        res.status(200).json(conteo);
        return;
    } catch (error) {
        console.error("Error en getConteoById:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al obtener el conteo.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al obtener el conteo." });
        return;
    }
};
export const iniciarConteoFisico = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        descripcion_motivo_conteo,
        filtros_aplicados_info,
        notas_generales_conteo
    } = req.body;

    const id_usuario_responsable_fk = req.user!.id; // Usuario que inicia el conteo

    try {
        const conteoRepository = AppDataSource.getRepository(ConteoFisico);
        const userRepository = AppDataSource.getRepository(User);

        const usuarioResponsable = await userRepository.findOneBy({ id_usuario: id_usuario_responsable_fk });
        if (!usuarioResponsable) {
            // Esto no debería ocurrir si checkAuth funciona bien y el usuario existe
            res.status(404).json({ message: "Usuario responsable no encontrado." });
            return;
        }

        const nuevoConteo = new ConteoFisico();
        nuevoConteo.usuario_responsable = usuarioResponsable;
        // fecha_inicio_conteo y fecha_creacion_registro se establecen por @CreateDateColumn
        // estado_conteo tiene default 'Iniciado' en la entidad
        if (descripcion_motivo_conteo) nuevoConteo.descripcion_motivo_conteo = descripcion_motivo_conteo;
        if (filtros_aplicados_info) nuevoConteo.filtros_aplicados_info = filtros_aplicados_info;
        if (notas_generales_conteo) nuevoConteo.notas_generales_conteo = notas_generales_conteo;

        await conteoRepository.save(nuevoConteo);

        // Recargar para obtener las fechas generadas automáticamente y el estado por defecto
        const conteoGuardado = await conteoRepository.findOne({
            where: { id_conteo: nuevoConteo.id_conteo },
            relations: ["usuario_responsable"]
        });

        res.status(201).json(conteoGuardado);
        return;

    } catch (error) {
        console.error("Error en iniciarConteoFisico:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al iniciar el conteo físico.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al iniciar el conteo físico." });
        return;
    }
};

interface DetalleConteoInput {
    id_producto_fk: number;
    stock_fisico_contado_primaria?: number; // Cantidad contada, ya convertida a unidad primaria (opcional si se usa unidad alternativa)
    id_unidad_medida_conteo_fk?: number;    // Opcional: si se contó en unidad alternativa
    cantidad_contada_en_unidad_conteo?: number; // Opcional: la cantidad en la unidad de conteo
    notas_detalle_conteo?: string;
}

export const addDetallesConteoFisico = async (req: AuthRequest, res: Response): Promise<void> => {
    const { idConteo } = req.params; // ID del ConteoFisico padre
    const detallesInput: DetalleConteoInput[] = req.body; // Esperamos un array de detalles

    if (!Array.isArray(detallesInput) || detallesInput.length === 0) {
        res.status(400).json({ message: "Se requiere un array de detalles de conteo." });
        return;
    }

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const conteoRepository = transactionalEntityManager.getRepository(ConteoFisico);
            const detalleRepository = transactionalEntityManager.getRepository(DetalleConteoFisico);
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const unidadMedidaRepository = transactionalEntityManager.getRepository(UnidadMedida);

            const conteoPadre = await conteoRepository.findOneBy({ id_conteo: parseInt(idConteo) });
            if (!conteoPadre) throw new Error(`Conteo Físico con ID ${idConteo} no encontrado.`);
            if (conteoPadre.estado_conteo !== 'Iniciado' && conteoPadre.estado_conteo !== 'En Progreso') {
                throw new Error(`No se pueden añadir detalles a un conteo en estado '${conteoPadre.estado_conteo}'.`);
            }

            const detallesCreados: DetalleConteoFisico[] = [];

            for (const item of detallesInput) {
                if (!item.id_producto_fk) throw new Error("Cada detalle debe incluir id_producto_fk.");
                if (item.stock_fisico_contado_primaria === undefined && (item.id_unidad_medida_conteo_fk === undefined || item.cantidad_contada_en_unidad_conteo === undefined)) {
                     throw new Error("Debe proporcionar stock_fisico_contado_primaria o (id_unidad_medida_conteo_fk y cantidad_contada_en_unidad_conteo).");
                }
                 if (item.stock_fisico_contado_primaria !== undefined && Number(item.stock_fisico_contado_primaria) < 0) {
                     throw new Error("stock_fisico_contado_primaria no puede ser negativo.");
                }
                if (item.cantidad_contada_en_unidad_conteo !== undefined && Number(item.cantidad_contada_en_unidad_conteo) < 0) {
                    throw new Error("cantidad_contada_en_unidad_conteo no puede ser negativa.");
               }

                const producto = await productoRepository.findOne({
                    where: { id_producto: item.id_producto_fk },
                    relations: ["unidad_medida_primaria", "unidad_conteo_alternativa"]
                });
                if (!producto) throw new Error(`Producto con ID ${item.id_producto_fk} no encontrado.`);

                let stockFisicoContadoPrimaria: number;
                let unidadConteo: UnidadMedida | null = null;

                if (item.id_unidad_medida_conteo_fk && item.cantidad_contada_en_unidad_conteo !== undefined) {
                    unidadConteo = await unidadMedidaRepository.findOneBy({ id_unidad_medida: item.id_unidad_medida_conteo_fk });
                    if (!unidadConteo) throw new Error(`Unidad de medida de conteo con ID ${item.id_unidad_medida_conteo_fk} no encontrada.`);

                    const cantidadNum = Number(item.cantidad_contada_en_unidad_conteo);
                    if (unidadConteo.id_unidad_medida === producto.unidad_medida_primaria.id_unidad_medida) {
                        stockFisicoContadoPrimaria = cantidadNum;
                    } else if (producto.unidad_conteo_alternativa && unidadConteo.id_unidad_medida === producto.unidad_conteo_alternativa.id_unidad_medida && producto.cantidad_por_unidad_alternativa) {
                        stockFisicoContadoPrimaria = cantidadNum * producto.cantidad_por_unidad_alternativa;
                    } else {
                        throw new Error(`La unidad de medida de conteo '${unidadConteo.nombre_unidad}' no es válida para el producto '${producto.nombre_producto}' o falta configuración de unidad alternativa.`);
                    }
                } else if (item.stock_fisico_contado_primaria !== undefined) {
                    stockFisicoContadoPrimaria = Number(item.stock_fisico_contado_primaria);
                } else {
                    // Esto no debería ocurrir debido a la validación anterior, pero por si acaso.
                    throw new Error("Datos de cantidad contada insuficientes para el producto ID " + item.id_producto_fk);
                }
                
                if (stockFisicoContadoPrimaria < 0) throw new Error("La cantidad física contada (convertida a primaria) no puede ser negativa.");

                // Verificar si ya existe un detalle para este producto en este conteo
                let detalleExistente = await detalleRepository.findOneBy({
                    conteo_fisico: { id_conteo: conteoPadre.id_conteo },
                    producto: { id_producto: producto.id_producto }
                });

                if (detalleExistente) { // Actualizar el existente
                    detalleExistente.stock_fisico_contado_primaria = stockFisicoContadoPrimaria;
                    detalleExistente.stock_teorico_primaria = producto.stock_actual; // Actualizar por si cambió el stock teórico
                    detalleExistente.diferencia_primaria = stockFisicoContadoPrimaria - producto.stock_actual;
                    // Asignar la entidad completa, no solo el ID
                    detalleExistente.unidad_medida_conteo = unidadConteo;
                    detalleExistente.cantidad_contada_en_unidad_conteo = item.cantidad_contada_en_unidad_conteo !== undefined ? Number(item.cantidad_contada_en_unidad_conteo) : null;
                    detalleExistente.notas_detalle_conteo = item.notas_detalle_conteo || null;
                    await transactionalEntityManager.save(DetalleConteoFisico, detalleExistente);
                    detallesCreados.push(detalleExistente);
                } else { // Crear nuevo detalle
                    const nuevoDetalle = new DetalleConteoFisico();
                    nuevoDetalle.conteo_fisico = conteoPadre;
                    nuevoDetalle.producto = producto;
                    nuevoDetalle.stock_teorico_primaria = producto.stock_actual; // Stock del sistema al momento de añadir el detalle
                    nuevoDetalle.stock_fisico_contado_primaria = stockFisicoContadoPrimaria;
                    nuevoDetalle.diferencia_primaria = stockFisicoContadoPrimaria - producto.stock_actual;
                    // Asignar la entidad completa, no solo el ID
                    nuevoDetalle.unidad_medida_conteo = unidadConteo;
                    nuevoDetalle.cantidad_contada_en_unidad_conteo = item.cantidad_contada_en_unidad_conteo !== undefined ? Number(item.cantidad_contada_en_unidad_conteo) : null;
                    nuevoDetalle.notas_detalle_conteo = item.notas_detalle_conteo || null;
                    
                    await transactionalEntityManager.save(DetalleConteoFisico, nuevoDetalle);
                    detallesCreados.push(nuevoDetalle);
                }
            }
            
            // Opcional: Cambiar estado del conteo padre a "En Progreso" si estaba "Iniciado"
            if (conteoPadre.estado_conteo === 'Iniciado') {
                conteoPadre.estado_conteo = 'En Progreso';
                await transactionalEntityManager.save(ConteoFisico, conteoPadre);
            }

            res.status(201).json(detallesCreados);
            return;

        } catch (error) {
            console.error("Error en transacción de addDetallesConteoFisico:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al añadir detalles al conteo." });
                } else {
                    res.status(500).json({ message: "Error desconocido al añadir detalles al conteo." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en addDetallesConteoFisico:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al añadir detalles.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al añadir detalles con error desconocido." });
            }
        }
    });
};
// server/src/controllers/conteo.controller.ts
// ... (imports y las funciones iniciarConteoFisico, addDetallesConteoFisico que ya tienes) ...

// --- NUEVA FUNCIÓN ---
export const finalizarConteoFisico = async (req: AuthRequest, res: Response): Promise<void> => {
    const { idConteo } = req.params;
    const { notas_finalizacion } = req.body; // Opcional desde el body

    try {
        const conteoRepository = AppDataSource.getRepository(ConteoFisico);
        const conteo = await conteoRepository.findOne({
            where: { id_conteo: parseInt(idConteo) },
            relations: ["usuario_responsable", "detalles_conteo"] // Cargar detalles para referencia si es necesario
        });

        if (!conteo) {
            res.status(404).json({ message: `Conteo Físico con ID ${idConteo} no encontrado.` });
            return;
        }

        if (conteo.estado_conteo !== 'Iniciado' && conteo.estado_conteo !== 'En Progreso') {
            res.status(409).json({ message: `El conteo ya está en estado '${conteo.estado_conteo}' y no puede ser finalizado nuevamente o desde este estado.` });
            return;
        }
        
        // Opcional: Validar que tenga al menos un detalle antes de finalizar
        // if (!conteo.detalles_conteo || conteo.detalles_conteo.length === 0) {
        //     res.status(400).json({ message: "No se puede finalizar un conteo sin detalles registrados." });
        //     return;
        // }

        conteo.estado_conteo = 'Registrado'; // Estado que indica que el conteo de ítems ha terminado
        conteo.fecha_finalizacion_conteo = new Date();
        if (notas_finalizacion) {
            conteo.notas_generales_conteo = conteo.notas_generales_conteo 
                ? `${conteo.notas_generales_conteo}\nFinalización: ${notas_finalizacion}` 
                : `Finalización: ${notas_finalizacion}`;
        }

        await conteoRepository.save(conteo);
        
        // Recargar con todas las relaciones deseadas para la respuesta
        const conteoFinalizado = await conteoRepository.findOne({
            where: {id_conteo: conteo.id_conteo },
            relations: ["usuario_responsable", "detalles_conteo", "detalles_conteo.producto", "detalles_conteo.unidad_medida_conteo"]
        });


        res.status(200).json(conteoFinalizado);
        return;

    } catch (error) {
        console.error("Error en finalizarConteoFisico:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error al finalizar el conteo físico.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error al finalizar el conteo físico." });
        return;
    }
};
// server/src/controllers/conteo.controller.ts
// ... (imports y las funciones iniciarConteoFisico, addDetallesConteoFisico, finalizarConteoFisico que ya tienes) ...

// --- NUEVA FUNCIÓN ---
export const aplicarAjustesConteoFisico = async (req: AuthRequest, res: Response): Promise<void> => {
    const { idConteo } = req.params;
    const id_usuario_ajuste_fk = req.user!.id; // Usuario que aplica los ajustes

    await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const conteoRepository = transactionalEntityManager.getRepository(ConteoFisico);
            const detalleRepository = transactionalEntityManager.getRepository(DetalleConteoFisico);
            const productoRepository = transactionalEntityManager.getRepository(Producto);
            const tipoMovimientoRepository = transactionalEntityManager.getRepository(TipoMovimiento);
            const userRepository = transactionalEntityManager.getRepository(User);

            const conteo = await conteoRepository.findOne({
                where: { id_conteo: parseInt(idConteo) },
                relations: [
                    "detalles_conteo",
                    "detalles_conteo.producto",
                    "detalles_conteo.producto.unidad_medida_primaria" // Para el movimiento
                ]
            });

            if (!conteo) throw new Error(`Conteo Físico con ID ${idConteo} no encontrado.`);
            if (conteo.estado_conteo !== 'Registrado') { // Solo se pueden aplicar ajustes a conteos 'Registrados'
                throw new Error(`No se pueden aplicar ajustes a un conteo en estado '${conteo.estado_conteo}'. Debe estar 'Registrado'.`);
            }

            const usuarioAjuste = await userRepository.findOneBy({ id_usuario: id_usuario_ajuste_fk });
            if (!usuarioAjuste) throw new Error("Usuario que aplica el ajuste no encontrado.");

            // Obtener los tipos de movimiento para ajustes
            const tipoMovAjustePos = await tipoMovimientoRepository.findOneBy({ nombre_tipo: 'Ajuste Positivo Inventario', efecto_stock: 1 });
            const tipoMovAjusteNeg = await tipoMovimientoRepository.findOneBy({ nombre_tipo: 'Ajuste Negativo Inventario', efecto_stock: -1 });

            if (!tipoMovAjustePos || !tipoMovAjusteNeg) {
                throw new Error("No se encontraron los Tipos de Movimiento necesarios para 'Ajuste Positivo/Negativo Inventario'. Asegúrate de que existan en la base de datos con el efecto_stock correcto.");
            }

            for (const detalle of conteo.detalles_conteo) {
                if (detalle.diferencia_primaria !== 0 && !detalle.ajuste_aplicado) {
                    const producto = detalle.producto;
                    const tipoMovimientoParaEsteAjuste = detalle.diferencia_primaria > 0 ? tipoMovAjustePos : tipoMovAjusteNeg;
                    const cantidadAjustada = Math.abs(detalle.diferencia_primaria);

                    // Crear Movimiento de Inventario para el ajuste
                    const nuevoMovimientoAjuste = new MovimientoInventario();
                    nuevoMovimientoAjuste.producto = producto;
                    nuevoMovimientoAjuste.tipo_movimiento = tipoMovimientoParaEsteAjuste;
                    nuevoMovimientoAjuste.cantidad_movida = cantidadAjustada;
                    nuevoMovimientoAjuste.unidad_medida_movimiento = producto.unidad_medida_primaria;
                    nuevoMovimientoAjuste.cantidad_convertida_a_primaria = cantidadAjustada;
                    nuevoMovimientoAjuste.stock_anterior_primaria = producto.stock_actual;
                    nuevoMovimientoAjuste.stock_nuevo_primaria = producto.stock_actual + detalle.diferencia_primaria; // Usamos la diferencia con su signo
                    nuevoMovimientoAjuste.usuario = usuarioAjuste;
                    nuevoMovimientoAjuste.referencia_documento = `Ajuste Conteo #${conteo.id_conteo}`;
                    nuevoMovimientoAjuste.notas_adicionales = `Ajuste por diferencia. Teórico: ${detalle.stock_teorico_primaria}, Físico: ${detalle.stock_fisico_contado_primaria}.`;
                    
                    const movimientoGuardado = await transactionalEntityManager.save(MovimientoInventario, nuevoMovimientoAjuste);

                    // Actualizar stock del producto
                    producto.stock_actual = nuevoMovimientoAjuste.stock_nuevo_primaria;
                    await transactionalEntityManager.save(Producto, producto);

                    // Marcar detalle como ajustado y enlazar movimiento
                    detalle.ajuste_aplicado = true;
                    detalle.movimiento_ajuste = movimientoGuardado; // Enlazar el movimiento al detalle
                    await transactionalEntityManager.save(DetalleConteoFisico, detalle);
                }
            }

            conteo.estado_conteo = 'Ajustes Aplicados';
            await transactionalEntityManager.save(ConteoFisico, conteo);

            // Recargar para devolver el objeto completo
            const conteoActualizado = await conteoRepository.findOne({
                where: {id_conteo: conteo.id_conteo },
                relations: ["usuario_responsable", "detalles_conteo", "detalles_conteo.producto", "detalles_conteo.unidad_medida_conteo", "detalles_conteo.movimiento_ajuste"]
            });

            res.status(200).json(conteoActualizado);
            return;

        } catch (error) {
            console.error("Error en transacción de aplicarAjustesConteoFisico:", error);
            if (!res.headersSent) {
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message || "Error al aplicar los ajustes del conteo." });
                } else {
                    res.status(500).json({ message: "Error desconocido al aplicar los ajustes del conteo." });
                }
            }
        }
    }).catch(transactionError => {
        console.error("Error de la transacción general en aplicarAjustesConteoFisico:", transactionError);
        if (!res.headersSent) {
            if (transactionError instanceof Error) {
                res.status(500).json({ message: "Fallo la transacción al aplicar ajustes.", error: transactionError.message });
            } else {
                res.status(500).json({ message: "Fallo la transacción al aplicar ajustes con error desconocido." });
            }
        }
    });
};