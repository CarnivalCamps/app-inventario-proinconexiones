// server/src/entities/DetalleConteoFisico.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToOne // Importaremos OneToOne para la relación con MovimientoInventario
} from "typeorm";
import { ConteoFisico } from "./ConteoFisico";
import { Producto } from "./Producto";
import { UnidadMedida } from "./UnidadMedida";
import { MovimientoInventario } from "./MovimientoInventario";

@Entity({ name: 'detalles_conteo_fisico' }) // Mapea a la tabla 'detalles_conteo_fisico'
export class DetalleConteoFisico {

    @PrimaryGeneratedColumn()
    id_detalle_conteo!: number;

    @Column({ type: 'integer', nullable: false }) // CHECK (stock_teorico_primaria >= 0) en BD
    stock_teorico_primaria!: number; // Stock del sistema al momento del conteo (unidad primaria)

    @Column({ type: 'integer', nullable: false }) // CHECK (stock_fisico_contado_primaria >= 0) en BD
    stock_fisico_contado_primaria!: number; // Cantidad física contada (convertida a unidad primaria)

    @Column({ type: 'integer', nullable: true }) // CHECK (cantidad_contada_en_unidad_conteo >= 0) en BD
    cantidad_contada_en_unidad_conteo!: number | null; // Cantidad en la unidad de conteo, si se usó una alternativa

    @Column({ type: 'integer', nullable: false })
    diferencia_primaria!: number; // Calculado: stock_fisico_contado_primaria - stock_teorico_primaria

    @Column({ type: 'boolean', nullable: false, default: false })
    ajuste_aplicado!: boolean; // Indica si la diferencia generó un movimiento de ajuste

    @Column({ type: 'text', nullable: true })
    notas_detalle_conteo!: string | null;

    // --- Relaciones ---
    @ManyToOne(() => ConteoFisico, (conteo) => conteo.detalles_conteo, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_conteo_fk' })
    conteo_fisico!: ConteoFisico;

    @ManyToOne(() => Producto, { nullable: false, eager: true }) // eager: true para cargar producto con el detalle
    @JoinColumn({ name: 'id_producto_fk' })
    producto!: Producto;

    @ManyToOne(() => UnidadMedida, { nullable: true, eager: true }) // eager: true si se usa una unidad de conteo específica
    @JoinColumn({ name: 'id_unidad_medida_conteo_fk' })
    unidad_medida_conteo!: UnidadMedida | null; // Unidad en la que se realizó el conteo físico

    // Relación con el movimiento de ajuste generado (si ajuste_aplicado es true)
    @OneToOne(() => MovimientoInventario, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'id_movimiento_ajuste_fk' })
    movimiento_ajuste!: MovimientoInventario | null;
}