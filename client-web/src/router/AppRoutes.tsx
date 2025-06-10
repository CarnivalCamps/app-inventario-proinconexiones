// client-web/src/router/AppRoutes.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'; 
import LoginPage from '../pages/LoginPage/LoginPage';
import ProductsPage from '../pages/ProductsPage/ProductsPage';
import { useAuth } from '../contexts/AuthContext';
import CreateProductPage from '../pages/CreateProductPage/CreateProductPage';
import ProductDetailPage from '../pages/ProductDetailPage/ProductDetailPage';
import EditProductPage from '../pages/EditProductPage/EditProductPage';
import CategoriesPage from '../pages/CategoriesPage/CategoriesPage';
import UnidadesMedidaPage from '../pages/UnidadesMedidaPage/UnidadesMedidaPage';
import ProveedoresPage from '../pages/ProveedoresPage/ProveedoresPage';
import SolicitudesListPage from '../pages/SolicitudesPage/SolicitudesListPage';
import SolicitudDetailPage from '../pages/SolicitudesPage/SolicitudDetailPage';
import CreateSolicitudPage from '../pages/SolicitudesPage/CreateSolicitudPage';
import ConteosListPage from '../pages/ConteosPage/ConteosListPage';
import ConteoDetailPage from '../pages/ConteosPage/ConteoDetailPage';
import HistorialMovimientosPage from '../pages/HistorialMovimientosPage/HistorialMovimientosPage';
import { getDashboardSummary } from '../services/dashboardService'; // Nuestro nuevo servicio
import type { DashboardSummary } from '../services/dashboardService'; // El tipo de dato
import MainLayout from '../layouts/MainLayout';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setIsLoading(true);
                const data = await getDashboardSummary();
                setSummary(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    // --- Estilos para las tarjetas del Dashboard ---
    const styles = {
        dashboardGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '20px',
        },
        card: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block' // Para que el Link ocupe toda la tarjeta
        },
        cardNumber: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
        },
        cardTitle: {
            margin: '0',
            color: '#555',
        },
        lowStockTable: {
            width: '100%',
            marginTop: '10px',
            borderCollapse: 'collapse' as 'collapse'
        }
    };

    if (isLoading) return <p>Cargando Dashboard...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Bienvenido, {user?.nombre_usuario || 'Usuario'}!</h2>
            <p>Aquí tienes un resumen del estado actual de tu inventario.</p>

            <div style={styles.dashboardGrid}>
                {/* Tarjeta de Solicitudes Pendientes */}
                <Link to="/solicitudes" style={styles.card}>
                    <p style={styles.cardNumber}>{summary?.conteoPendientesAprobacion ?? 0}</p>
                    <h4 style={styles.cardTitle}>Solicitudes Pendientes de Aprobación</h4>
                </Link>

                {/* Tarjeta de Conteos en Progreso */}
                <Link to="/conteos" style={styles.card}>
                    <p style={styles.cardNumber}>{summary?.conteoConteosEnProgreso ?? 0}</p>
                    <h4 style={styles.cardTitle}>Conteos en Progreso</h4>
                </Link>

                {/* Tarjeta de Alertas de Stock Bajo */}
                <div style={{...styles.card, gridColumn: 'span 2'}}>
                    <p style={{...styles.cardNumber, color: summary?.conteoProductosStockBajo ?? 0 > 0 ? 'orange' : 'inherit'}}>
                        {summary?.conteoProductosStockBajo ?? 0}
                    </p>
                    <h4 style={styles.cardTitle}>Productos con Stock Bajo</h4>
                    {summary && summary.productosConStockBajo.length > 0 ? (
                        <table border={1} style={styles.lowStockTable}>
                            <thead>
                                <tr><th>Producto (SKU)</th><th>Stock Actual</th><th>Stock Mínimo</th></tr>
                            </thead>
                            <tbody>
                                {summary.productosConStockBajo.map(p => (
                                    <tr key={p.id_producto}>
                                        <td><Link to={`/productos/${p.id_producto}`}>{p.nombre_producto} ({p.sku})</Link></td>
                                        <td style={{textAlign: 'center', color: 'red'}}>{p.stock_actual}</td>
                                        <td style={{textAlign: 'center'}}>{p.stock_minimo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>¡No hay productos con stock bajo!</p>
                    )}
                </div>
            </div>

            <hr style={{margin: '30px 0'}}/>

            <h3>Menú de Gestión</h3>
            <nav style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                <Link to="/productos">Gestionar Productos</Link>
                <Link to="/solicitudes">Gestionar Solicitudes</Link>
                <Link to="/conteos">Gestionar Conteos</Link>
                <Link to="/historial-movimientos">Ver Historial</Link>
                <Link to="/categorias">Gestionar Categorías</Link>
                <Link to="/unidades-medida">Gestionar Unidades</Link>
                <Link to="/proveedores">Gestionar Proveedores</Link>
            </nav>

            <br />
            <button onClick={logout}>Cerrar Sesión</button>
        </div>
    );
};

const HomePage: React.FC = () => <h2>Página de Inicio Pública</h2>;

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Cargando sesión...</div>; 
    }

    return isAuthenticated ? (
        <MainLayout>
            <Outlet /> {/* Outlet renderiza la ruta hija (ej. DashboardPage) */}
        </MainLayout>
    ) : (
        <Navigate to="/login" replace />
    );
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Rutas de productos */}
                <Route path="/productos" element={<ProductsPage />} />
                <Route path="/productos/nuevo" element={<CreateProductPage />} />
                <Route path="/productos/:id" element={<ProductDetailPage />} />
                <Route path="/productos/:id/editar" element={<EditProductPage />} />
                
                {/* Rutas de configuración */}
                <Route path="/categorias" element={<CategoriesPage />} />
                <Route path="/unidades-medida" element={<UnidadesMedidaPage />} />
                <Route path="/proveedores" element={<ProveedoresPage />} />
                
                {/* Rutas de solicitudes */}
                <Route path="/solicitudes" element={<SolicitudesListPage />} />
                <Route path="/solicitudes/nueva" element={<CreateSolicitudPage />} />
                <Route path="/solicitudes/:id" element={<SolicitudDetailPage />} />
                
                {/* Rutas de conteos */}
                <Route path="/conteos" element={<ConteosListPage />} />
                <Route path="/conteos/:id" element={<ConteoDetailPage />} />

                <Route path="/historial-movimientos" element={<HistorialMovimientosPage />} />
            </Route>
            
            {/* Ruta catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;