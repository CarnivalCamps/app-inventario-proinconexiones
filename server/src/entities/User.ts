// server/src/entities/User.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Role } from "./Role"; // Importamos la entidad Role para la relación

@Entity({ name: 'usuarios' }) // Mapea a la tabla 'usuarios'
export class User {

    @PrimaryGeneratedColumn()
    id_usuario!: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    nombre_completo!: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    nombre_usuario!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    contrasena_hash!: string;

    @Column({ type: 'boolean', default: true, nullable: false })
    activo!: boolean;

    // --- Relación Muchos a Uno ---
    // Muchos usuarios pueden tener un rol.
    @ManyToOne(() => Role, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_rol_fk' }) // Especifica el nombre de la columna de la clave foránea
    rol!: Role;

    // --- Columnas de Fecha Automáticas ---
    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    ultima_modificacion!: Date;
}