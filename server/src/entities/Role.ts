// server/src/entities/Role.ts

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: 'roles' }) // Le decimos a TypeORM que esta clase es una entidad que mapea a la tabla 'roles'
export class Role {

    @PrimaryGeneratedColumn() // Define la columna como clave primaria autoincremental (SERIAL)
    id_rol!: number;

    @Column({
        type: 'varchar',
        length: 50,
        unique: true,
        nullable: false
    }) // Define una columna regular
    nombre_rol!: string;

    @Column({
        type: 'text',
        nullable: true // Esta columna puede ser nula
    })
    descripcion_rol!: string;
}