// client-web/src/pages/EditProductPage/EditProductPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { getProductoById, updateProducto, updateProductoUbicaciones } from '../../services/productService';
import type { ProductoFrontend, UpdateProductPayload, CreateProductPayload } from '../../services/productService';
import { getCategorias } from '../../services/categoriaService';
import type { CategoriaFrontend } from '../../services/categoriaService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/unidadMedidaService';
import { getProveedores } from '../../services/proveedorService';
import type { ProveedorFrontend } from '../../services/proveedorService';
import { getUbicacionesTree, getUbicacionesConStock } from '../../services/ubicacionService';
import type { UbicacionFrontend, UbicacionConStock } from '../../services/ubicacionService';
import MapaAlmacen from '../../components/MapaAlmacen/MapaAlmacen';

// Imports de MUI
import {
    Paper,
    Box,
    Typography,
    Grid,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    ListItemIcon,
    Checkbox,
    Tab,
    Tabs
} from '@mui/material';


import type { SelectChangeEvent } from '@mui/material/Select';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import EditLocationIcon from '@mui/icons-material/EditLocation';

// Interfaz para manejar asignaciones de ubicación
interface UbicacionAsignacion {
    id_ubicacion: number;
    nombre_ubicacion: string;
    codigo_ubicacion?: string;
    stock_actual?: number;
    asignada: boolean;
}

// Usamos CreateProductPayload como base para el estado del formulario
const initialFormData: Partial<CreateProductPayload> = {
    sku: '',
    nombre_producto: '',
};

// Componente de TabPanel personalizado
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const EditProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = parseInt(id || '0', 10);

    const [formData, setFormData] = useState<Partial<CreateProductPayload>>(initialFormData);
    const [categorias, setCategorias] = useState<CategoriaFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [ubicaciones, setUbicaciones] = useState<UbicacionFrontend[]>([]);
    const [ubicacionesConStockData, setUbicacionesConStockData] = useState<UbicacionConStock[]>([]);
    const [ubicacionesAsignaciones, setUbicacionesAsignaciones] = useState<UbicacionAsignacion[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [loadingUbicaciones, setLoadingUbicaciones] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentProduct, setCurrentProduct] = useState<ProductoFrontend | null>(null);
    
    // Estados para la gestión de ubicaciones
    const [openLocationDialog, setOpenLocationDialog] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (!productId) {
            setError("ID de producto inválido.");
            setPageLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setPageLoading(true);
                setLoadingUbicaciones(true);
                
                console.log('🔄 Iniciando carga de datos para producto ID:', productId);
                
                const [productoData, cats, ums, provs, ubicacionesData, ubicacionesConStockRaw] = await Promise.all([
                    getProductoById(productId),
                    getCategorias(),
                    getUnidadesMedida(),
                    getProveedores(),
                    getUbicacionesTree(),
                    getUbicacionesConStock()
                ]);

                console.log('📦 Producto cargado:', productoData);
                console.log('📍 Ubicaciones tree:', ubicacionesData);
                console.log('📊 Ubicaciones con stock (raw):', ubicacionesConStockRaw);

                setCurrentProduct(productoData);
                
                // Poblar el formulario con los datos del producto existente
                setFormData({
                    sku: productoData.sku,
                    nombre_producto: productoData.nombre_producto,
                    descripcion_corta: productoData.descripcion_corta,
                    descripcion_larga: productoData.descripcion_larga,
                    id_categoria_fk: productoData.categoria?.id_categoria || undefined,
                    id_unidad_medida_primaria_fk: productoData.unidad_medida_primaria.id_unidad_medida,
                    stock_minimo: productoData.stock_minimo,
                    stock_maximo: productoData.stock_maximo,
                    ubicacion_almacen: productoData.ubicacion_almacen,
                    imagen_url: productoData.imagen_url,
                    id_unidad_conteo_alternativa_fk: productoData.unidad_conteo_alternativa?.id_unidad_medida || undefined,
                    cantidad_por_unidad_alternativa: productoData.cantidad_por_unidad_alternativa
                });

                setCategorias(cats);
                setUnidadesMedida(ums);
                setProveedores(provs);
                setUbicaciones(ubicacionesData);

                // Preparar asignaciones de ubicaciones
                const ubicacionesPlanas = aplanarUbicaciones(ubicacionesData);
                const asignaciones: UbicacionAsignacion[] = ubicacionesPlanas.map(ub => {
                    const stockInfo = ubicacionesConStockRaw.find(stock => stock.id_ubicacion === ub.id_ubicacion);
                    const tieneProducto = stockInfo?.productos_en_ubicacion?.some(p => p.id_producto === productId) || false;
                    const stockActual = stockInfo?.productos_en_ubicacion?.find(p => p.id_producto === productId)?.cantidad || 0;

                    return {
                        id_ubicacion: ub.id_ubicacion,
                        nombre_ubicacion: ub.nombre,
                        codigo_ubicacion: ub.codigo_legible || undefined,
                        stock_actual: tieneProducto ? stockActual : 0,
                        asignada: tieneProducto
                    };
                });

                setUbicacionesAsignaciones(asignaciones);

                // Filtrar ubicaciones que contienen el producto específico
                const ubicacionesFiltradas = ubicacionesConStockRaw.filter(ub => {
                    return ub.productos_en_ubicacion?.some(p => p.id_producto === productId);
                });

                console.log('📍 Ubicaciones filtradas para el producto:', ubicacionesFiltradas);
                
                if (ubicacionesFiltradas.length === 0) {
                    console.log('⚠️ No se encontraron ubicaciones con stock para este producto');
                    setUbicacionesConStockData(ubicacionesConStockRaw);
                } else {
                    setUbicacionesConStockData(ubicacionesFiltradas);
                }

            } catch (err: any) {
                console.error('❌ Error cargando datos:', err);
                setError(err.message || "Error cargando datos para el formulario.");
            } finally {
                setPageLoading(false);
                setLoadingUbicaciones(false);
            }
        };
        
        fetchData();
    }, [productId]);

    // Función para aplanar el árbol de ubicaciones
    const aplanarUbicaciones = (ubicacionesTree: UbicacionFrontend[]): UbicacionFrontend[] => {
        const result: UbicacionFrontend[] = [];

        const procesarUbicacion = (ubicacion: UbicacionFrontend, nivel: number = 0) => {
            const prefijo = '—'.repeat(nivel) + ' ';
            const ubicacionConNivel = {
                ...ubicacion,
                // Usamos 'nombre' que es la propiedad correcta de UbicacionFrontend
                nombre: prefijo + ubicacion.nombre 
            };
            result.push(ubicacionConNivel);

            // Usamos 'hijos' que es la propiedad correcta
            if (ubicacion.hijos) {
                ubicacion.hijos.forEach(hijo => procesarUbicacion(hijo, nivel + 1));
            }
        };

        ubicacionesTree.forEach(ub => procesarUbicacion(ub));
        return result;
    };

    // Función para obtener información de ubicaciones del producto
    const getProductLocationInfo = () => {
        const ubicacionesAsignadas = ubicacionesAsignaciones.filter(ub => ub.asignada);
        return {
            tieneUbicaciones: ubicacionesAsignadas.length > 0,
            cantidadUbicaciones: ubicacionesAsignadas.length,
            ubicaciones: ubicacionesAsignadas
        };
    };

    // Handler para cambiar asignación de ubicación
    const handleUbicacionToggle = (ubicacionId: number) => {
        setUbicacionesAsignaciones(prev => 
            prev.map(ub => 
                ub.id_ubicacion === ubicacionId 
                    ? { ...ub, asignada: !ub.asignada }
                    : ub
            )
        );
    };

    // Handler para tabs
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handler para guardar solo las ubicaciones
    const handleGuardarUbicaciones = async () => {
        setError(null);
        setLoading(true);

        try {
            const idUbicacionesAsignadas = ubicacionesAsignaciones
                .filter(ub => ub.asignada)
                .map(ub => ub.id_ubicacion);
            
            console.log('📍 Guardando las siguientes IDs de ubicación:', idUbicacionesAsignadas);
            await updateProductoUbicaciones(productId, idUbicacionesAsignadas);
            
            alert(`Las ubicaciones del producto "${formData.nombre_producto}" han sido actualizadas!`);
        } catch (err: any) {
            console.error('❌ Error actualizando ubicaciones:', err);
            setError(err.message || "Ocurrió un error al actualizar las ubicaciones del producto.");
        } finally {
            setLoading(false);
        }
    };

    // Handlers del formulario original
    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | null = value;

        if (type === 'number') {
            processedValue = value === '' ? null : Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSelectChange = (event: SelectChangeEvent<string | number>, fieldName: string) => {
        const value = event.target.value;
        let processedValue: string | number | null | undefined = value;

        if (fieldName === 'id_categoria_fk' || fieldName === 'id_proveedor_preferido_fk' || fieldName === 'id_unidad_conteo_alternativa_fk') {
            processedValue = value === '' ? undefined : Number(value);
        }
        if (fieldName === 'id_unidad_medida_primaria_fk') {
            processedValue = Number(value);
        }

        if (fieldName === 'id_unidad_conteo_alternativa_fk') {
            const nuevaUnidadAlternativaId = value === '' ? undefined : Number(value);
            if (nuevaUnidadAlternativaId === undefined) {
                setFormData(prev => ({
                    ...prev,
                    id_unidad_conteo_alternativa_fk: undefined,
                    cantidad_por_unidad_alternativa: null
                }));
            } else {
                setFormData(prev => ({ ...prev, id_unidad_conteo_alternativa_fk: nuevaUnidadAlternativaId }));
            }
        } else {
            setFormData(prev => ({ ...prev, [fieldName]: processedValue }));
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.sku || !formData.nombre_producto || !formData.id_unidad_medida_primaria_fk) {
            setError("SKU, Nombre del producto y Unidad de Medida Primaria son obligatorios.");
            setLoading(false);
            return;
        }
        if (formData.id_unidad_conteo_alternativa_fk && (!formData.cantidad_por_unidad_alternativa || formData.cantidad_por_unidad_alternativa <= 0)) {
            setError("Si selecciona una unidad de conteo alternativa, la cantidad por unidad debe ser mayor a 0.");
            setLoading(false);
            return;
        }
        if (!formData.id_unidad_conteo_alternativa_fk && formData.cantidad_por_unidad_alternativa) {
            setError("No puede ingresar cantidad por unidad alternativa si no ha seleccionado una unidad alternativa.");
            setLoading(false);
            return;
        }

        try {
            const payloadToSend: UpdateProductPayload = {
                ...formData,
                id_categoria_fk: formData.id_categoria_fk || null,
                id_proveedor_preferido_fk: formData.id_proveedor_preferido_fk || null,
                id_unidad_conteo_alternativa_fk: formData.id_unidad_conteo_alternativa_fk || null,
            };

            console.log('💾 Guardando producto con payload:', payloadToSend);
            await updateProducto(productId, payloadToSend);
            
            const idUbicacionesAsignadas = ubicacionesAsignaciones
                .filter(ub => ub.asignada)
                .map(ub => ub.id_ubicacion);
            console.log('📍 Guardando las siguientes IDs de ubicación:', idUbicacionesAsignadas);
            await updateProductoUbicaciones(productId, idUbicacionesAsignadas);
            
            alert(`Producto "${formData.nombre_producto}" y sus ubicaciones han sido actualizados!`);
            navigate(`/productos/${productId}`);
        } catch (err: any) {
            console.error('❌ Error actualizando producto:', err);
            setError(err.message || "Ocurrió un error al actualizar el producto.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Cargando datos del producto para editar...
                </Typography>
            </Box>
        );
    }

    if (error && !formData.sku) {
        return <Alert severity="error">Error: {error}</Alert>;
    }

    const locationInfo = getProductLocationInfo();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Panel principal del formulario */}
            <Paper elevation={3} sx={{ padding: '24px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Editar Producto: {formData.nombre_producto || 'Cargando...'}
                    </Typography>
                    <Button
                        variant="text"
                        startIcon={<ArrowBackIcon />}
                        component={RouterLink}
                        to={`/productos/${productId}`}
                    >
                        Volver al detalle
                    </Button>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Pestañas principales */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="product edit tabs">
                        <Tab label="Información del Producto" />
                        <Tab label="Gestión de Ubicaciones" />
                    </Tabs>
                </Box>

                {/* Pestaña 1: Información del Producto */}
                <CustomTabPanel value={tabValue} index={0}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Información básica */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" gutterBottom>
                                    Información Básica
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="SKU"
                                    name="sku"
                                    value={formData.sku || ''}
                                    onChange={handleTextFieldChange}
                                    required
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre del Producto"
                                    name="nombre_producto"
                                    value={formData.nombre_producto || ''}
                                    onChange={handleTextFieldChange}
                                    required
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Descripción Corta"
                                    name="descripcion_corta"
                                    value={formData.descripcion_corta || ''}
                                    onChange={handleTextFieldChange}
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Descripción Larga"
                                    name="descripcion_larga"
                                    value={formData.descripcion_larga || ''}
                                    onChange={handleTextFieldChange}
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                />
                            </Grid>

                            {/* Clasificación */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Clasificación
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        name="id_categoria_fk"
                                        value={formData.id_categoria_fk || ''}
                                        onChange={(e) => handleSelectChange(e, 'id_categoria_fk')}
                                        label="Categoría"
                                    >
                                        <MenuItem value="">-- Sin Categoría --</MenuItem>
                                        {categorias.map(cat => (
                                            <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                                                {cat.nombre_categoria}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Unidades de medida */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Unidades de Medida
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Unidad de Medida Primaria</InputLabel>
                                    <Select
                                        name="id_unidad_medida_primaria_fk"
                                        value={formData.id_unidad_medida_primaria_fk || ''}
                                        onChange={(e) => handleSelectChange(e, 'id_unidad_medida_primaria_fk')}
                                        label="Unidad de Medida Primaria"
                                    >
                                        <MenuItem value="">-- Seleccionar --</MenuItem>
                                        {unidadesMedida.map(um => (
                                            <MenuItem key={um.id_unidad_medida} value={um.id_unidad_medida}>
                                                {um.nombre_unidad} ({um.abreviatura})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Unidad de Conteo Alternativa</InputLabel>
                                    <Select
                                        name="id_unidad_conteo_alternativa_fk"
                                        value={formData.id_unidad_conteo_alternativa_fk || ''}
                                        onChange={(e) => handleSelectChange(e, 'id_unidad_conteo_alternativa_fk')}
                                        label="Unidad de Conteo Alternativa"
                                    >
                                        <MenuItem value="">-- Ninguna --</MenuItem>
                                        {unidadesMedida.map(um => (
                                            <MenuItem key={um.id_unidad_medida} value={um.id_unidad_medida}>
                                                {um.nombre_unidad} ({um.abreviatura})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Cantidad por Unidad Alternativa"
                                    name="cantidad_por_unidad_alternativa"
                                    type="number"
                                    value={formData.cantidad_por_unidad_alternativa || ''}
                                    onChange={handleTextFieldChange}
                                    inputProps={{ min: 1 }}
                                    variant="outlined"
                                />
                            </Grid>

                            {/* Stock */}
                            <Grid size={{ xs: 12}}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Control de Stock
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Stock Mínimo"
                                    name="stock_minimo"
                                    type="number"
                                    value={formData.stock_minimo === null ? '' : formData.stock_minimo}
                                    onChange={handleTextFieldChange}
                                    inputProps={{ min: 0 }}
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Stock Máximo"
                                    name="stock_maximo"
                                    type="number"
                                    value={formData.stock_maximo === null ? '' : formData.stock_maximo}
                                    onChange={handleTextFieldChange}
                                    inputProps={{ min: 0 }}
                                    variant="outlined"
                                />
                            </Grid>

                            {/* Proveedor y ubicación */}
                            <Grid size={{ xs: 12}}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Información Adicional
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Proveedor Preferido</InputLabel>
                                    <Select
                                        name="id_proveedor_preferido_fk"
                                        value={formData.id_proveedor_preferido_fk || ''}
                                        onChange={(e) => handleSelectChange(e, 'id_proveedor_preferido_fk')}
                                        label="Proveedor Preferido"
                                    >
                                        <MenuItem value="">-- Ninguno --</MenuItem>
                                        {proveedores.map(prov => (
                                            <MenuItem key={prov.id_proveedor} value={prov.id_proveedor}>
                                                {prov.nombre_proveedor}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Ubicación en Almacén"
                                    name="ubicacion_almacen"
                                    value={formData.ubicacion_almacen || ''}
                                    onChange={handleTextFieldChange}
                                    variant="outlined"
                                    helperText="Este campo es independiente del mapa. Se usa para referencia textual."
                                />
                            </Grid>

                            <Grid size={{ xs: 12}}>
                                <TextField
                                    fullWidth
                                    label="URL de Imagen"
                                    name="imagen_url"
                                    value={formData.imagen_url || ''}
                                    onChange={handleTextFieldChange}
                                    variant="outlined"
                                />
                            </Grid>

                            {/* Botones de acción */}
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                        disabled={loading || pageLoading}
                                        size="large"
                                    >
                                        {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        component={RouterLink}
                                        to={`/productos/${productId}`}
                                        disabled={loading}
                                        size="large"
                                    >
                                        Cancelar
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CustomTabPanel>

                {/* Pestaña 2: Gestión de Ubicaciones */}
                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Gestión de Ubicaciones del Producto
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Selecciona las ubicaciones donde se almacenará este producto
                        </Typography>
                    </Box>

                    {/* Resumen de ubicaciones actuales */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <WarehouseIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Ubicaciones Asignadas ({locationInfo.cantidadUbicaciones})
                                </Typography>
                            </Box>
                            
                            {locationInfo.tieneUbicaciones ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {locationInfo.ubicaciones.map(ubicacion => (
                                        <Chip
                                            key={ubicacion.id_ubicacion}
                                            label={`${ubicacion.nombre_ubicacion} ${ubicacion.stock_actual ? `(Stock: ${ubicacion.stock_actual})` : ''}`}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Alert severity="info">
                                    Este producto no tiene ubicaciones asignadas actualmente
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de ubicaciones disponibles */}
                    <Card>
                        <CardHeader 
                            title="Ubicaciones Disponibles"
                            subheader="Marca las casillas para asignar o desasignar ubicaciones"
                            action={
                                <Button
                                    variant="outlined"
                                    startIcon={<EditLocationIcon />}
                                    onClick={() => setOpenLocationDialog(true)}
                                >
                                    Vista Detallada
                                </Button>
                            }
                        />
                        <CardContent>
                            <List>
                                {ubicacionesAsignaciones.map((ubicacion) => (
                                    <ListItem 
                                        key={ubicacion.id_ubicacion}
                                        disablePadding
                                    >
                                        <ListItemButton 
                                            onClick={() => handleUbicacionToggle(ubicacion.id_ubicacion)}
                                            dense
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={ubicacion.asignada}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={ubicacion.nombre_ubicacion}
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {ubicacion.codigo_ubicacion && (
                                                            <Chip 
                                                                label={ubicacion.codigo_ubicacion} 
                                                                size="small" 
                                                                variant="outlined" 
                                                            />
                                                        )}
                                                        {ubicacion.asignada && ubicacion.stock_actual !== undefined && (
                                                            <Chip 
                                                                label={`Stock: ${ubicacion.stock_actual}`} 
                                                                size="small" 
                                                                color="success"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>

                            {/* Botones de acción para ubicaciones */}
                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleGuardarUbicaciones}
                                    disabled={loading}
                                >
                                    Guardar Asignaciones
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        // Resetear a estado original
                                        const ubicacionesAsignadasOriginales = ubicacionesConStockData
                                            .filter(ub => ub.productos_en_ubicacion?.some(p => p.id_producto === productId))
                                            .map(ub => ub.id_ubicacion);
                                        
                                        setUbicacionesAsignaciones(prev => 
                                            prev.map(ub => ({
                                                ...ub,
                                                asignada: ubicacionesAsignadasOriginales.includes(ub.id_ubicacion)
                                            }))
                                        );
                                    }}
                                >
                                    Resetear Cambios
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </CustomTabPanel>
            </Paper>

            {/* Panel del mapa de ubicación */}
            {currentProduct && (
                <Card elevation={3}>
                    <CardHeader 
                        avatar={<LocationOnIcon color="primary" />}
                        title="Ubicación Actual en el Almacén"
                        subheader={
                            locationInfo.tieneUbicaciones 
                                ? `El producto se encuentra en ${locationInfo.cantidadUbicaciones} ubicación(es)`
                                : "Este producto no tiene ubicaciones asignadas en el almacén"
                        }
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
                            <>
                                {!locationInfo.tieneUbicaciones && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                            ⚠️ <strong>Sin ubicaciones asignadas:</strong> Este producto no tiene ubicaciones específicas en el almacén. 
                                            El mapa muestra todas las ubicaciones disponibles para referencia.
                                        </Typography>
                                    </Alert>
                                )}
                                
                                <Box sx={{ 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <MapaAlmacen 
                                        ubicaciones={ubicaciones}
                                        ubicacionesConStock={ubicacionesConStockData}
                                        width={800}
                                        height={400}
                                        productoId={currentProduct.id_producto}
                                    />
                                </Box>
                            </>
                        )}
                        
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Typography variant="body2" color="text.secondary">
                                💡 <strong>Información:</strong> 
                                {locationInfo.tieneUbicaciones 
                                    ? " Las ubicaciones resaltadas en verde contienen este producto. "
                                    : " Para asignar ubicaciones específicas a este producto, utiliza la pestaña 'Gestión de Ubicaciones'. "
                                }
                                El campo "Ubicación en Almacén" del formulario es solo para referencia textual.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Dialog detallado de ubicaciones */}
            <Dialog 
                open={openLocationDialog} 
                onClose={() => setOpenLocationDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditLocationIcon sx={{ mr: 1 }} />
                        Gestión Detallada de Ubicaciones
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Vista detallada para gestionar las ubicaciones del producto "{formData.nombre_producto}"
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Resumen de cambios:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {ubicacionesAsignaciones.filter(ub => ub.asignada).length === 0 ? (
                                <Chip label="Sin ubicaciones asignadas" color="warning" size="small" />
                            ) : (
                                ubicacionesAsignaciones
                                    .filter(ub => ub.asignada)
                                    .map(ub => (
                                        <Chip 
                                            key={ub.id_ubicacion}
                                            label={ub.nombre_ubicacion.trim()}
                                            color="primary" 
                                            size="small"
                                            onDelete={() => handleUbicacionToggle(ub.id_ubicacion)}
                                        />
                                    ))
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Todas las ubicaciones disponibles:
                    </Typography>
                    
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {ubicacionesAsignaciones.map((ubicacion) => (
                            <ListItem 
                                key={ubicacion.id_ubicacion}
                                disablePadding
                                sx={{ 
                                    backgroundColor: ubicacion.asignada ? 'action.selected' : 'transparent',
                                    borderRadius: 1,
                                    mb: 0.5
                                }}
                            >
                                <ListItemButton 
                                    onClick={() => handleUbicacionToggle(ubicacion.id_ubicacion)}
                                    dense
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={ubicacion.asignada}
                                            tabIndex={-1}
                                            disableRipple
                                            color="primary"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: ubicacion.asignada ? 'bold' : 'normal' }}>
                                                {ubicacion.nombre_ubicacion}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                {ubicacion.codigo_ubicacion && (
                                                    <Chip 
                                                        label={`Código: ${ubicacion.codigo_ubicacion}`} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                )}
                                                {ubicacion.asignada && ubicacion.stock_actual !== undefined && (
                                                    <Chip 
                                                        label={`Stock actual: ${ubicacion.stock_actual}`} 
                                                        size="small" 
                                                        color="success"
                                                        variant="filled"
                                                    />
                                                )}
                                                {ubicacion.asignada && (
                                                    <Chip 
                                                        label="ASIGNADA" 
                                                        size="small" 
                                                        color="primary"
                                                        variant="filled"
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenLocationDialog(false)}
                        variant="outlined"
                    >
                        Cerrar
                    </Button>
                    <Button 
                        onClick={() => {
                            setOpenLocationDialog(false);
                            // Aquí podrías llamar directamente a handleSubmit si quieres guardar inmediatamente
                        }}
                        variant="contained"
                        startIcon={<SaveIcon />}
                    >
                        Aplicar y Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EditProductPage;