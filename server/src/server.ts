// server/src/server.ts

import 'reflect-metadata';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors, { CorsOptions} from 'cors'; // <--- 1. IMPORTA CORS
import { AppDataSource } from './data-source';
import authRoutes from './routes/auth.routes';
import categoriaRoutes from './routes/categoria.routes';
import unidadMedidaRoutes from './routes/unidadMedida.routes';
import proveedorRoutes from './routes/proveedor.routes';
import productoRoutes from './routes/producto.routes';
import movimientoRoutes from './routes/movimiento.routes';
import solicitudRoutes from './routes/solicitud.routes';
import conteoRoutes from './routes/conteo.routes';
import dashboardRoutes from './routes/dashboard.routes';
import ordenCompraRoutes from './routes/ordenCompra.routes'; 
import ubicacionRoutes from './routes/ubicacion.routes';
import stockRoutes from './routes/stock.routes';

dotenv.config();

AppDataSource.initialize()
    .then(() => {
        console.log("¡Conexión con la base de datos establecida correctamente! ✅");

        const app: Application = express();
        const port: number = parseInt(process.env.PORT || '3001');

        // --- CONFIGURACIÓN DE CORS MÁS EXPLÍCITA ---
        const allowedOrigins = ['http://localhost:5173']; // El puerto de tu frontend Vite
        const corsOptions: CorsOptions = {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Origen no permitido por CORS'));
                }
            },
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // <--- ¡AÑADE ESTA LÍNEA!
            optionsSuccessStatus: 200 
        };
        app.use(cors(corsOptions));
        app.use(express.json()); // Para parsear bodies JSON

        // --- CONFIGURACIÓN DE RUTAS ---
        app.use('/api/auth', authRoutes);
        app.use('/api/categorias', categoriaRoutes);
        app.use('/api/unidades-medida', unidadMedidaRoutes);
        app.use('/api/proveedores', proveedorRoutes);
        app.use('/api/productos', productoRoutes);
        app.use('/api/movimientos', movimientoRoutes);
        app.use('/api/solicitudes', solicitudRoutes);
        app.use('/api/conteos', conteoRoutes);
        app.use('/api/dashboard', dashboardRoutes);
        app.use('/api/ordenes-compra', ordenCompraRoutes);
        app.use('/api/ubicaciones', ubicacionRoutes);
        app.use('/api/stock', stockRoutes);

        app.listen(port, () => {
          console.log(`Servidor backend escuchando en http://localhost:${port} 🚀`);
        });

    })
    .catch((error) => {
        console.error("❌ Error al conectar con la base de datos:", error);
    });