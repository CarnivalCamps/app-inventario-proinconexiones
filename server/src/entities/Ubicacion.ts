// server/src/entities/Ubicacion.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, } from "typeorm";
import { StockProducto } from "./StockProducto";

@Entity({ name: 'ubicaciones' })
export class Ubicacion {

    @PrimaryGeneratedColumn()
    id_ubicacion!: number;

    @Column({ type: 'varchar', length: 100 })
    nombre!: string; // Ej: "Almacén Central", "Estantería A-01", "Nivel 3", "Caja 12"

    @Column({ type: 'varchar', length: 50, nullable: true })
    tipo!: string | null; // Ej: 'ALMACEN', 'ESTANTERIA', 'FILA', 'NIVEL', 'CAJA'

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    codigo_legible!: string | null; // Ej: "AC-A01-N3-C12" (se puede generar automáticamente)

    @Column({ type: 'text', nullable: true })
    descripcion!: string | null;

    @Column({ type: 'integer', nullable: true })
    capacidad!: number | null; 

    // Relación jerárquica (padre-hijo)
    @ManyToOne(() => Ubicacion, (ubicacion) => ubicacion.hijos, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_ubicacion_padre_fk' })
    padre!: Ubicacion | null;

    @OneToMany(() => Ubicacion, (ubicacion) => ubicacion.padre)
    hijos!: Ubicacion[];

    @OneToMany(() => StockProducto, (stockProducto) => stockProducto.ubicacion)
    stockProductos!: StockProducto[]; // Añadir esta relación

    @Column({ type: 'integer', nullable: true, comment: 'Número de filas de slots en un nivel' })
    slot_filas!: number | null;

    @Column({ type: 'integer', nullable: true, comment: 'Número de columnas de slots en un nivel' })
    slot_columnas!: number | null;
    
    // --- SECCIÓN CORREGIDA ---
    @Column({ type: 'integer', nullable: true, comment: 'Coordenada X para el mapa visual' })
    pos_x!: number | null;

    @Column({ type: 'integer', nullable: true, comment: 'Coordenada Y para el mapa visual' })
    pos_y!: number | null;

    @Column({ type: 'integer', nullable: true, comment: 'Ancho para el mapa visual' })
    width!: number | null;

    @Column({ type: 'integer', nullable: true, comment: 'Alto para el mapa visual' })
    height!: number | null;
}
