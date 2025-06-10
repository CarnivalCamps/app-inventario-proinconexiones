// server/src/entities/ConteoFisico.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany // Importaremos OneToMany cuando creemos DetalleConteoFisico
} from "typeorm";
import { User } from "./User";
import { DetalleConteoFisico } from "./DetalleConteoFisico";
// Más adelante importaremos DetalleConteoFisico para la relación inversa

@Entity({ name: 'conteos_fisicos' }) // Mapea a la tabla 'conteos_fisicos'
export class ConteoFisico {

    @PrimaryGeneratedColumn()
    id_conteo!: number;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_inicio_conteo' })
    fecha_inicio_conteo!: Date; // Fecha en que se inicia el conteo

    @Column({ type: 'timestamp with time zone', nullable: true })
    fecha_finalizacion_conteo!: Date | null;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
        default: 'Iniciado'
        // En BD: CHECK (estado_conteo IN ('Iniciado', 'En Progreso', 'Registrado', 'Ajustes Aplicados', 'Cancelado'))
    })
    estado_conteo!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    descripcion_motivo_conteo!: string | null;

    @Column({ type: 'text', nullable: true }) // Podría ser JSONB si los filtros son estructurados
    filtros_aplicados_info!: string | null;

    @Column({ type: 'text', nullable: true })
    notas_generales_conteo!: string | null;

    // --- Relaciones ---
    @ManyToOne(() => User, { nullable: false }) // Un conteo siempre es responsabilidad de un usuario
    @JoinColumn({ name: 'id_usuario_responsable_fk' })
    usuario_responsable!: User;

    // --- Timestamps del Registro ---
    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_creacion_registro' })
    fecha_creacion_registro!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'ultima_modificacion_registro' })
    ultima_modificacion_registro!: Date;

    // --- Relación Inversa (se añadirá cuando definamos DetalleConteoFisico) ---
    @OneToMany(() => DetalleConteoFisico, (detalle) => detalle.conteo_fisico)
    detalles_conteo!: DetalleConteoFisico[];
}