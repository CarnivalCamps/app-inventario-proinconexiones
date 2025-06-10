// server/src/entities/Producto.ts

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { CategoriaProducto } from "./CategoriaProducto";
import { UnidadMedida } from "./UnidadMedida";
import { Proveedor } from "./Proveedor"; // Importamos Proveedor

@Entity({ name: 'productos' }) // Mapea a la tabla 'productos'
export class Producto {

    @PrimaryGeneratedColumn()
    id_producto!: number;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    sku!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    nombre_producto!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    descripcion_corta!: string | null;

    @Column({ type: 'text', nullable: true })
    descripcion_larga!: string | null;

    @Column({ type: 'integer', default: 0, nullable: false })
    stock_actual!: number; // Se aplicará CHECK (stock_actual >= 0) en la BD

    @Column({ type: 'integer', default: 0, nullable: false })
    stock_minimo!: number; // Se aplicará CHECK (stock_minimo >= 0) en la BD

    @Column({ type: 'integer', nullable: true })
    stock_maximo!: number | null; // Se aplicará CHECK (stock_maximo IS NULL OR stock_maximo >= 0)

    @Column({ type: 'varchar', length: 255, nullable: true })
    ubicacion_almacen!: string | null;

    @Column({ type: 'text', nullable: true })
    imagen_url!: string | null;

    @Column({ type: 'integer', nullable: true })
    cantidad_por_unidad_alternativa!: number | null; // CHECK (>0) si id_unidad_conteo_alternativa_fk no es null

    // --- Relaciones ---
    @ManyToOne(() => CategoriaProducto, { nullable: true, eager: true }) // eager: true para cargar categoría con producto
    @JoinColumn({ name: 'id_categoria_fk' })
    categoria!: CategoriaProducto | null; // Permitimos que sea null

    @ManyToOne(() => UnidadMedida, { nullable: false, eager: true }) // eager: true para cargar unidad con producto
    @JoinColumn({ name: 'id_unidad_medida_primaria_fk' })
    unidad_medida_primaria!: UnidadMedida;

    @ManyToOne(() => UnidadMedida, { nullable: true, eager: true }) // eager: true para cargar unidad alternativa
    @JoinColumn({ name: 'id_unidad_conteo_alternativa_fk' })
    unidad_conteo_alternativa!: UnidadMedida | null; // Permitimos que sea null

    @ManyToOne(() => Proveedor, { nullable: true, eager: true }) // eager: true para cargar proveedor
    @JoinColumn({ name: 'id_proveedor_preferido_fk' })
    proveedor_preferido!: Proveedor | null; // Permitimos que sea null

    // --- Timestamps ---
    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    ultima_modificacion!: Date;
}