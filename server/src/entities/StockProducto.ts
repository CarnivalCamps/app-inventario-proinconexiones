// server/src/entities/StockProducto.ts
import { Entity, Column, ManyToOne, PrimaryColumn } from "typeorm";
import { Producto } from "./Producto";
import { Ubicacion } from "./Ubicacion";

@Entity({ name: 'stock_productos' })
export class StockProducto {
    // Usamos claves primarias compuestas
    @PrimaryColumn()
    id_producto_fk!: number;

    @PrimaryColumn()
    id_ubicacion_fk!: number;

    @ManyToOne(() => Producto, { onDelete: 'CASCADE' })
    producto!: Producto;

    @ManyToOne(() => Ubicacion, { onDelete: 'CASCADE' })
    ubicacion!: Ubicacion;

    @Column({ type: 'integer' })
    cantidad!: number; // Stock de este producto en esta ubicación específica
}