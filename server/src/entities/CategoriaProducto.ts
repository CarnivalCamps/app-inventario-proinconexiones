// server/src/entities/CategoriaProducto.ts

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: 'categorias_productos' }) // Mapea a la tabla 'categorias_productos'
export class CategoriaProducto {

    @PrimaryGeneratedColumn()
    id_categoria!: number;

    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: false
    })
    nombre_categoria!: string;

    @Column({
        type: 'text',
        nullable: true // La descripción es opcional
    })
    descripcion_categoria!: string;
}