// server/src/entities/DetalleSolicitudReserva.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { SolicitudReserva } from "./SolicitudReserva";
import { Producto } from "./Producto";
import { UnidadMedida } from "./UnidadMedida";

@Entity({ name: 'detalles_solicitud_reserva' }) // Mapea a la tabla 'detalles_solicitud_reserva'
export class DetalleSolicitudReserva {

    @PrimaryGeneratedColumn()
    id_detalle_solicitud!: number;

    @Column({ type: 'integer', nullable: false }) // CHECK (cantidad_solicitada > 0) en BD
    cantidad_solicitada!: number;

    @Column({ type: 'integer', nullable: false }) // CHECK (cantidad_solicitada_convertida_a_primaria > 0) en BD
    cantidad_solicitada_convertida_a_primaria!: number;

    @Column({ type: 'integer', nullable: true }) // CHECK (cantidad_aprobada_primaria >= 0) en BD
    cantidad_aprobada_primaria!: number | null; // Cantidad aprobada por almacén, en unidad primaria

    @Column({ type: 'integer', nullable: false, default: 0 }) // CHECK (cantidad_entregada_primaria >= 0) en BD
    cantidad_entregada_primaria!: number; // Cantidad entregada, en unidad primaria

    @Column({ type: 'integer', nullable: true }) // CHECK (stock_disponible_al_solicitar_primaria >=0) en BD
    stock_disponible_al_solicitar_primaria!: number | null; // Snapshot del stock disponible

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true
        // CHECK (precio_unitario_venta_registrado >= 0) en BD
    })
    precio_unitario_venta_registrado!: number | null; // Opcional

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true
        // Calculado: cantidad_aprobada_primaria * precio_unitario_venta_registrado
    })
    subtotal_linea_registrado!: number | null; // Opcional

    // --- Relaciones ---
    @ManyToOne(() => SolicitudReserva, (solicitud) => solicitud.detalles_solicitud, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_solicitud_fk' })
    solicitud_reserva!: SolicitudReserva;

    @ManyToOne(() => Producto, { nullable: false, eager: true }) // eager: true para cargar el producto fácilmente con el detalle
    @JoinColumn({ name: 'id_producto_fk' })
    producto!: Producto;

    @ManyToOne(() => UnidadMedida, { nullable: false, eager: true }) // eager: true para cargar la unidad fácilmente
    @JoinColumn({ name: 'id_unidad_medida_solicitada_fk' })
    unidad_medida_solicitada!: UnidadMedida;
}