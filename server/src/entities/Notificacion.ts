// server/src/entities/Notificacion.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { User } from "./User";

@Entity({ name: 'notificaciones' }) // Mapea a la tabla 'notificaciones'
export class Notificacion {

    @PrimaryGeneratedColumn()
    id_notificacion!: number;

    @Column({ type: 'text', nullable: false })
    mensaje_notificacion!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    tipo_notificacion!: string; // Ej: "ALERTA_STOCK_BAJO", "SOLICITUD_APROBADA"

    @Column({ type: 'boolean', nullable: false, default: false })
    leida!: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    fecha_lectura!: Date | null;

    @Column({ type: 'text', nullable: true })
    url_destino!: string | null; // URL interna de la app

    @Column({ type: 'integer', nullable: true })
    id_recurso_asociado!: number | null; // Ej: id_producto, id_solicitud

    @Column({ type: 'varchar', length: 100, nullable: true })
    tabla_recurso_asociado!: string | null; // Ej: "Productos", "SolicitudesReserva"

    // --- Relaciones ---
    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' }) // Si se borra el usuario, se borran sus notificaciones
    @JoinColumn({ name: 'id_usuario_destinatario_fk' })
    usuario_destinatario!: User;

    // --- Timestamps ---
    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;
}