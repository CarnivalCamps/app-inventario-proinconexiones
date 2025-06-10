// server/src/data-source.ts

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import {Role} from './entities/Role';
import {User} from './entities/User';
import {CategoriaProducto} from './entities/CategoriaProducto';
import { UnidadMedida } from './entities/UnidadMedida';
import { Proveedor } from './entities/Proveedor';
import { Producto } from './entities/Producto';
import { RazonMovimiento } from './entities/RazonMovimiento';
import { TipoMovimiento } from './entities/TipoMovimiento';
import { MovimientoInventario } from './entities/MovimientoInventario';
import { SolicitudReserva } from './entities/SolicitudReserva';
import { DetalleSolicitudReserva } from './entities/DetalleSolicitudReserva';   
import { ConteoFisico } from './entities/ConteoFisico';
import { DetalleConteoFisico } from './entities/DetalleConteoFisico';
import { Notificacion } from './entities/Notificacion';
import { ConfiguracionSistema } from './entities/ConfiguracionSistema';



// Carga las variables de entorno para que estén disponibles
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    /**
     * synchronize: true
     * ¡SOLO PARA DESARROLLO!
     * Esto crea automáticamente las tablas de la base de datos a partir de tus
     * entidades cada vez que la aplicación se inicia. En producción,
     * se usan "migraciones" para evitar la pérdida de datos.
     */
    synchronize: true,

    // logging: true // Descomenta esta línea si quieres ver cada consulta SQL en la consola
    logging: false,

    /**
     * entities: []
     * Aquí es donde registraremos todas nuestras clases que representan
     * tablas en la base de datos. Por ahora está vacío, pero lo llenaremos
     * en el siguiente paso.
     */
    entities: [
        Role,
        User,
        CategoriaProducto,
        UnidadMedida,
        Proveedor,
        Producto,
        TipoMovimiento,
        RazonMovimiento,
        MovimientoInventario,
        SolicitudReserva,
        DetalleSolicitudReserva,
        ConteoFisico,
        DetalleConteoFisico,
        Notificacion,
        ConfiguracionSistema,
    ],

    migrations: [],
    subscribers: [],
});