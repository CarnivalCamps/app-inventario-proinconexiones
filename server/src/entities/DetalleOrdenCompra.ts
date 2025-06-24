// server/src/entities/DetalleOrdenCompra.ts

import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn
} from "typeorm";
import { OrdenCompra } from "./OrdenCompra";
import { Producto } from "./Producto";

@Entity({ name: 'detalles_orden_compra' })
export class DetalleOrdenCompra {

    @PrimaryGeneratedColumn()
    id_detalle_orden!: number;

    @Column({ type: 'integer' })
    cantidad_solicitada!: number;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    costo_unitario!: number; // Costo del producto al momento de la compra

    @Column({ type: 'integer', default: 0 })
    cantidad_recibida!: number; // Para manejar recepciones parciales

    // --- Relaciones ---
    @ManyToOne(() => OrdenCompra, (orden) => orden.detalles, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_orden_compra_fk' })
    orden_compra!: OrdenCompra;

    @ManyToOne(() => Producto, { nullable: false, eager: true }) // eager:true para cargar info del producto fácilmente
    @JoinColumn({ name: 'id_producto_fk' })
    producto!: Producto;
}