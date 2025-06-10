// server/src/entities/MovimientoInventario.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne // Asegúrate de que OneToOne esté importado
} from "typeorm";
import { Producto } from "./Producto";
import { User } from "./User";
import { TipoMovimiento } from "./TipoMovimiento";
import { UnidadMedida } from "./UnidadMedida";
import { RazonMovimiento } from "./RazonMovimiento";
import { DetalleSolicitudReserva } from "./DetalleSolicitudReserva";
import { DetalleConteoFisico } from "./DetalleConteoFisico"; // <--- 1. IMPORTA ESTO (si no estaba)

@Entity({ name: 'movimientos_inventario' })
export class MovimientoInventario {

    // ... (id_movimiento, fecha_movimiento, ... otras propiedades que ya tenías) ...
    // ... (asegúrate de no borrar nada de lo que ya estaba) ...

    @PrimaryGeneratedColumn()
    id_movimiento!: number;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_movimiento' })
    fecha_movimiento!: Date;

    @Column({ type: 'integer', nullable: false })
    cantidad_movida!: number;

    @Column({ type: 'integer', nullable: false })
    cantidad_convertida_a_primaria!: number;

    @Column({ type: 'integer', nullable: false })
    stock_anterior_primaria!: number;

    @Column({ type: 'integer', nullable: false })
    stock_nuevo_primaria!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    referencia_documento!: string | null;

    @Column({ type: 'text', nullable: true })
    notas_adicionales!: string | null;

    @ManyToOne(() => Producto, { nullable: false })
    @JoinColumn({ name: 'id_producto_fk' })
    producto!: Producto;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'id_usuario_fk' })
    usuario!: User;

    @ManyToOne(() => TipoMovimiento, { nullable: false })
    @JoinColumn({ name: 'id_tipo_movimiento_fk' })
    tipo_movimiento!: TipoMovimiento;

    @ManyToOne(() => UnidadMedida, { nullable: false })
    @JoinColumn({ name: 'id_unidad_medida_movimiento_fk' })
    unidad_medida_movimiento!: UnidadMedida;

    @ManyToOne(() => RazonMovimiento, { nullable: true })
    @JoinColumn({ name: 'id_razon_movimiento_fk' })
    razon_movimiento!: RazonMovimiento | null;

    @ManyToOne(() => DetalleSolicitudReserva, { nullable: true })
    @JoinColumn({ name: 'id_solicitud_reserva_detalle_fk' })
    detalle_solicitud_reserva!: DetalleSolicitudReserva | null;

    // --- ESTA ES LA SECCIÓN QUE CAMBIAMOS ---
    // Antes era: @Column({ type: 'integer', name: 'id_detalle_conteo_fisico_fk', nullable: true })
    // Antes era: id_detalle_conteo_fisico_fk!: number | null;
    @OneToOne(() => DetalleConteoFisico, (detalle) => detalle.movimiento_ajuste, { nullable: true }) // <--- 2. MODIFICA ESTA SECCIÓN
    detalle_conteo_fisico!: DetalleConteoFisico | null;
    // No se necesita @JoinColumn aquí porque la columna FK (id_movimiento_ajuste_fk) ya está definida en DetalleConteoFisico.
    // Esta propiedad `detalle_conteo_fisico` en MovimientoInventario es el "otro lado" de esa relación OneToOne.
}