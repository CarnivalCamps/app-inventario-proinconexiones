// server/src/entities/Proveedor.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'proveedores' }) // Mapea a la tabla 'proveedores'
export class Proveedor {

    @PrimaryGeneratedColumn()
    id_proveedor!: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    nombre_proveedor!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contacto_nombre!: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    contacto_email!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    contacto_telefono!: string;

    @Column({ type: 'text', nullable: true })
    direccion!: string;

    @Column({ type: 'text', nullable: true })
    notas!: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    ultima_modificacion!: Date;
}