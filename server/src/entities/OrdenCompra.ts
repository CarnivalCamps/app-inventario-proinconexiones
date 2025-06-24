// server/src/entities/OrdenCompra.ts

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, OneToMany, JoinColumn
} from "typeorm";
import { User } from "./User";
import { Proveedor } from "./Proveedor";
import { DetalleOrdenCompra } from "./DetalleOrdenCompra";

@Entity({ name: 'ordenes_compra' })
export class OrdenCompra {

    @PrimaryGeneratedColumn()
    id_orden_compra!: number;

    @Column({ type: 'date' })
    fecha_emision!: Date;

    @Column({ type: 'date', nullable: true })
    fecha_entrega_esperada!: Date | null;

    @Column({
        type: 'varchar',
        length: 50,
        default: 'Borrador' // Estados: Borrador, Enviada, Recibida Parcialmente, Recibida Totalmente, Cancelada
    })
    estado!: string;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    subtotal!: number | null;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    impuestos!: number | null;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    total!: number | null;

    @Column({ type: 'text', nullable: true })
    notas!: string | null;

    // --- Relaciones ---
    @ManyToOne(() => Proveedor, { nullable: false })
    @JoinColumn({ name: 'id_proveedor_fk' })
    proveedor!: Proveedor;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'id_usuario_creador_fk' })
    usuario_creador!: User;

    @OneToMany(() => DetalleOrdenCompra, (detalle) => detalle.orden_compra, { cascade: ['insert', 'update'] })
    detalles!: DetalleOrdenCompra[];

    // --- Timestamps ---
    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    ultima_modificacion!: Date;
}