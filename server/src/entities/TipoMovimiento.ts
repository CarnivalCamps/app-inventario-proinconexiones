// server/src/entities/TipoMovimiento.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RazonMovimiento } from "./RazonMovimiento"; // Necesario si queremos la relación inversa

@Entity({ name: 'tipos_movimiento' }) // Mapea a la tabla 'tipos_movimiento'
export class TipoMovimiento {

    @PrimaryGeneratedColumn()
    id_tipo_movimiento!: number;

    @Column({
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: false
    })
    nombre_tipo!: string; // Ej: "Entrada", "Salida Venta", "Ajuste Conteo"

    @Column({
        type: 'smallint',
        nullable: false
        // En la BD tendríamos un CHECK (efecto_stock IN (-1, 0, 1))
        // La lógica de la aplicación debe asegurar que los valores sean -1, 0, o 1.
    })
    efecto_stock!: number; // 1 para incrementar, -1 para decrementar, 0 si no afecta directamente

    // Opcional: Relación inversa para ver todas las razones asociadas a este tipo
    @OneToMany(() => RazonMovimiento, (razon) => razon.tipo_movimiento)
    razones_movimiento!: RazonMovimiento[];
}