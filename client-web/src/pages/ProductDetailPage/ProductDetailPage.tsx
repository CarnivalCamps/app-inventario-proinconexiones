import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { getProductoById, deleteProducto  } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { getUbicacionesTree, getUbicacionesConStock } from '../../services/ubicacionService'; // Cambiado a getUbicacionesConStock
import type { UbicacionFrontend, UbicacionConStock } from '../../services/ubicacionService'; // Importar UbicacionConStock
import MapaAlmacen from '../../components/MapaAlmacen/MapaAlmacen'; // Tu componente del mapa

// Imports de MUI
import { 
    Paper, 
    Box, 
    Typography, 
    Grid, 
    Divider, 
    Button, 
    CircularProgress, 
    Alert, 
    Chip,
    Card,
    CardContent,
    CardHeader
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Typography variant="caption" color="text.secondary" component="div">
            {label}
        </Typography>
        <Typography variant="body1" component="div">
            {value || '-'}
        </Typography>
    </Grid>
);

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [producto, setProducto] = useState<ProductoFrontend | null>(null);
    const [ubicaciones, setUbicaciones] = useState<UbicacionFrontend[]>([]);
    const [ubicacionesConStockData, setUbicacionesConStockData] = useState<UbicacionConStock[]>([]); // Cambiado a UbicacionConStock[]
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingUbicaciones, setLoadingUbicaciones] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const numericId = parseInt(id || '0', 10);

    useEffect(() => {
        const fetchData = async () => {
            if (numericId > 0) {
                try {
                    setLoading(true);
                    setError(null);
                    
                    // Cargar producto y ubicaciones en paralelo
                    const [productoData, ubicacionesData, ubicacionesConStockRaw] = await Promise.all([
                        getProductoById(numericId),
                        getUbicacionesTree(), // Todas las ubicaciones
                        getUbicacionesConStock() // Obtener todas las ubicaciones con stock
                    ]);
                    
                    setProducto(productoData);
                    setUbicaciones(ubicacionesData);
                    // Filtrar las ubicaciones que contienen el producto específico
                    const ubicacionesFiltradas = ubicacionesConStockRaw.filter(ub => 
                        ub.productos_en_ubicacion?.some(p => p.id_producto === numericId)
                    );
                    setUbicacionesConStockData(ubicacionesFiltradas); // Asignar al nuevo estado
                } catch (err: any) {
                    setError(err.message || 'Ocurrió un error desconocido.');
                } finally {
                    setLoading(false);
                    setLoadingUbicaciones(false);
                }
            } else {
                setError("ID de producto inválido.");
                setLoading(false);
                setLoadingUbicaciones(false);
            }
        };

        fetchData();
    }, [numericId]);

    const handleDelete = async () => {
        if (!producto) return;

        if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre_producto}"?`)) {
            setIsDeleting(true);
            setError(null);
            try {
                await deleteProducto(producto.id_producto);
                alert('Producto eliminado exitosamente.');
                navigate('/productos');
            } catch (err: any) {
                setError(err.message);
                setIsDeleting(false);
            }
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!producto) return <Alert severity="warning">Producto no encontrado.</Alert>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Panel principal del producto */}
            <Paper elevation={3} sx={{ padding: '24px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        {producto.nombre_producto}
                    </Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            component={RouterLink}
                            to={`/productos/${producto.id_producto}/editar`}
                            sx={{ mr: 1 }}
                        >
                            Editar
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
                        </Button>
                    </Box>
                </Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    SKU: {producto.sku}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                    <Grid size={12}>
                        <Typography variant="h6">Información General</Typography>
                    </Grid>

                    <DetailItem label="Descripción Corta" value={producto.descripcion_corta} />

                    <Grid size={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="h6">Detalles de Stock</Typography>
                    </Grid>

                    <DetailItem 
                        label="Stock Actual" 
                        value={
                            <Typography variant="h5" component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                                {producto.stock_actual}
                            </Typography>
                        } 
                    />
                    <DetailItem label="Stock Mínimo" value={producto.stock_minimo} />
                    <DetailItem 
                        label="Unidad de Medida Primaria" 
                        value={`${producto.unidad_medida_primaria.nombre_unidad} (${producto.unidad_medida_primaria.abreviatura})`} 
                    />

                    {producto.unidad_conteo_alternativa && (
                        <>
                            <DetailItem 
                                label="Unidad de Conteo Alternativa" 
                                value={`${producto.unidad_conteo_alternativa.nombre_unidad} (${producto.unidad_conteo_alternativa.abreviatura})`} 
                            />
                            <DetailItem 
                                label="Cantidad por Und. Alternativa" 
                                value={producto.cantidad_por_unidad_alternativa} 
                            />
                        </>
                    )}

                    <Grid size={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="h6">Clasificación y Origen</Typography>
                    </Grid>

                    <DetailItem 
                        label="Categoría" 
                        value={
                            producto.categoria 
                                ? <Chip label={producto.categoria.nombre_categoria} color="secondary" size="small" /> 
                                : '-'
                        } 
                    />
                </Grid>

                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="text"
                        startIcon={<ArrowBackIcon />}
                        component={RouterLink}
                        to="/productos"
                    >
                        Volver a la lista
                    </Button>
                </Box>
            </Paper>

            {/* Panel del mapa de ubicación */}
            <Card elevation={3}>
                <CardHeader 
                    avatar={<LocationOnIcon color="primary" />}
                    title="Ubicación en el Almacén"
                    subheader={`Localización del producto: ${producto.nombre_producto}`}
                />
                <CardContent>
                    {loadingUbicaciones ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                            <CircularProgress />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                                Cargando mapa del almacén...
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '8px', 
                            overflow: 'hidden',
                            backgroundColor: '#fafafa'
                        }}>
                            <MapaAlmacen 
                                ubicaciones={ubicaciones}
                                ubicacionesConStock={ubicacionesConStockData} // Pasar el nuevo estado
                                width={800}
                                height={500}
                                productoId={producto.id_producto}
                            />
                        </Box>
                    )}
                    
                    {/* Información adicional sobre la ubicación */}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <Typography variant="body2" color="text.secondary">
                            💡 <strong>Tip:</strong> Puedes arrastrar el mapa para moverte por el almacén. 
                            Las ubicaciones resaltadas muestran donde se encuentra este producto.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProductDetailPage;
