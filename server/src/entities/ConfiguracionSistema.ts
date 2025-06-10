// server/src/entities/ConfiguracionSistema.ts

import { Entity, Column, UpdateDateColumn, PrimaryColumn } from "typeorm";

@Entity({ name: 'configuraciones_sistema' }) // Mapea a la tabla 'configuraciones_sistema'
export class ConfiguracionSistema {

    @PrimaryColumn({ type: 'integer', default: 1 }) // Clave primaria fija, siempre será 1
    id_config!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    nombre_empresa!: string | null;

    @Column({ type: 'text', nullable: true })
    logo_empresa_url!: string | null;

    @Column({ type: 'integer', nullable: true })
    // En BD: CHECK (stock_minimo_global_defecto IS NULL OR stock_minimo_global_defecto >= 0)
    stock_minimo_global_defecto!: number | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email_contacto_principal!: string | null;

    @Column({ type: 'text', nullable: true })
    direccion_fiscal_empresa!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telefono_principal_empresa!: string | null;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'ultima_modificacion_registro' })
    ultima_modificacion_registro!: Date;

    // Constructor para asegurar que id_config siempre sea 1 si se crea una instancia
    constructor() {
        this.id_config = 1;
    }
}