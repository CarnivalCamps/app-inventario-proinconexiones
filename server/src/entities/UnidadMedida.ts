// server/src/entities/UnidadMedida.ts

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: 'unidades_medida' }) // Mapea a la tabla 'unidades_medida'
export class UnidadMedida {

    @PrimaryGeneratedColumn()
    id_unidad_medida!: number;

    @Column({
        type: 'varchar',
        length: 50,
        unique: true,
        nullable: false
    })
    nombre_unidad!: string;

    @Column({
        type: 'varchar',
        length: 15, // Suficiente para abreviaturas como 'ud', 'bolsa', 'caja', 'm'
        unique: true,
        nullable: false
    })
    abreviatura!: string;
}