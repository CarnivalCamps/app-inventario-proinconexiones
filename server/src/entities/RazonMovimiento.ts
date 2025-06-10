// server/src/entities/RazonMovimiento.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { TipoMovimiento } from "./TipoMovimiento";

@Entity({ name: 'razones_movimiento' }) // Mapea a la tabla 'razones_movimiento'
export class RazonMovimiento {

    @PrimaryGeneratedColumn()
    id_razon_movimiento!: number;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false
    })
    descripcion_razon!: string; // Ej: "Compra a proveedor", "Venta a cliente", "Merma por daño"

    @Column({
        type: 'boolean',
        default: false,
        nullable: false
    })
    requiere_justificacion_adicional!: boolean;

    @ManyToOne(() => TipoMovimiento, (tipo) => tipo.razones_movimiento, { nullable: true })
    @JoinColumn({ name: 'id_tipo_movimiento_fk' })
    tipo_movimiento!: TipoMovimiento | null; // Puede ser null si una razón no se agrupa bajo un tipo general
}