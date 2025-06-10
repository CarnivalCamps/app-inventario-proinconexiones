// server/src/entities/SolicitudReserva.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany // Importaremos OneToMany cuando creemos DetalleSolicitudReserva
} from "typeorm";
import { User } from "./User";
import { DetalleSolicitudReserva } from "./DetalleSolicitudReserva";
// Más adelante importaremos DetalleSolicitudReserva para la relación inversa

@Entity({ name: 'solicitudes_reserva' }) // Mapea a la tabla 'solicitudes_reserva'
export class SolicitudReserva {

    @PrimaryGeneratedColumn()
    id_solicitud!: number;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_solicitud' })
    fecha_solicitud!: Date; // Fecha en que se crea la solicitud

    @Column({ type: 'varchar', length: 255, nullable: false })
    proposito_solicitud!: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
        default: 'Pendiente'
        // En BD: CHECK (estado_solicitud IN ('Pendiente', 'Aprobada', 'Rechazada', 'Parcialmente Aprobada', 'Entregada', 'Cancelada'))
    })
    estado_solicitud!: string;

    @Column({ type: 'date', nullable: true })
    fecha_requerida_entrega!: Date | null;

    @Column({ type: 'text', nullable: true })
    justificacion_detallada!: string | null; // "Detalles Adicionales / Cliente / Justificación"

    @Column({ type: 'timestamp with time zone', nullable: true })
    fecha_procesamiento!: Date | null; // Fecha de aprobación/rechazo

    @Column({ type: 'text', nullable: true })
    razon_rechazo!: string | null;

    @Column({ type: 'text', nullable: true })
    notas_almacenista!: string | null;

    @Column({ type: 'timestamp with time zone', nullable: true })
    fecha_entrega_efectiva!: Date | null;

    // --- Relaciones ---
    @ManyToOne(() => User, { nullable: false }) // Una solicitud siempre es de un vendedor
    @JoinColumn({ name: 'id_vendedor_fk' })
    vendedor!: User;

    @ManyToOne(() => User, { nullable: true }) // El almacenista que procesa puede ser null inicialmente
    @JoinColumn({ name: 'id_almacenista_procesa_fk' })
    almacenista_procesa!: User | null;

    // --- Timestamps del Registro ---
    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_creacion_registro' })
    fecha_creacion_registro!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'ultima_modificacion_registro' })
    ultima_modificacion_registro!: Date;

    // --- Relación Inversa (se añadirá cuando definamos DetalleSolicitudReserva) ---
    @OneToMany(() => DetalleSolicitudReserva, (detalle) => detalle.solicitud_reserva)
    detalles_solicitud!: DetalleSolicitudReserva[];
    @Column({ type: 'text', name: 'notas_specificas_entrega', nullable: true }) // Nuevo nombre para evitar confusión
    notas_specificas_entrega!: string | null;
}