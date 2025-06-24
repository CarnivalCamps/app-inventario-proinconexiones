import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { UbicacionFrontend, UbicacionConStock } from '../../services/ubicacionService';
import ModalEstanteDetalle from './ModalEstanteDetalle';
import { Box, IconButton } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface MapaAlmacenProps {
    ubicaciones: UbicacionFrontend[];
    ubicacionesConStock?: UbicacionConStock[];
    width: number;
    height: number;
    productoId?: number;
}

const MapaAlmacen: React.FC<MapaAlmacenProps> = ({ 
    ubicaciones, 
    ubicacionesConStock = [],
    width, 
    height, 
    productoId 
}) => {
    const [estanteSeleccionado, setEstanteSeleccionado] = useState<UbicacionConStock | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [hoveredUbicacion, setHoveredUbicacion] = useState<UbicacionFrontend | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Manejar el zoom con el scroll del mouse
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const delta = e.evt.deltaY;
        const newZoom = zoomLevel + (delta > 0 ? -0.1 : 0.1);
        if (newZoom >= 0.5 && newZoom <= 2) {
            setZoomLevel(newZoom);
        }
    };

    // Manejar el panning con el drag del stage
    const handleStageDrag = (e: any) => {
        setPanX(e.target.x());
        setPanY(e.target.y());
    };

    // Debug: Agregar console.log para verificar los datos
    console.log('Ubicaciones recibidas:', ubicaciones);
    console.log('Ubicaciones con stock:', ubicacionesConStock);

    // Función para encontrar una UbicacionConStock por su id
    const findUbicacionConStock = (id: number): UbicacionConStock | undefined => {
        return ubicacionesConStock.find(ub => ub.id_ubicacion === id);
    };

    // Verifica si una ubicación tiene stock de *algún* producto o de un producto específico
    const ubicacionTieneProducto = (ubicacion: UbicacionFrontend): boolean => {
        const ubConStock = findUbicacionConStock(ubicacion.id_ubicacion);
        if (!ubConStock || !ubConStock.productos_en_ubicacion || ubConStock.productos_en_ubicacion.length === 0) {
            return false;
        }
        // Si se proporciona un productoId, verifica si ese producto está en la ubicación
        if (productoId) {
            return ubConStock.productos_en_ubicacion.some(p => p.id_producto === productoId);
        }
        // Si no se proporciona productoId, verifica si tiene cualquier producto
        return true;
    };

    const getColorFondo = (ubicacion: UbicacionFrontend): string => {
        if (ubicacionTieneProducto(ubicacion)) return '#4CAF50'; // Verde si tiene productos
        switch ((ubicacion.tipo || ubicacion.tipo_ubicacion || '').toLowerCase()) {
            case 'estanteria': return '#E3F2FD';
            case 'almacen': return '#FFF3E0';
            case 'zona': return '#F1F8E9';
            default: return '#FAFAFA';
        }
    };

    const getColorBorde = (ubicacion: UbicacionFrontend): string => {
        return ubicacionTieneProducto(ubicacion) ? '#2E7D32' : '#BDBDBD';
    };

    const renderizarUbicacion = (
        ubicacion: UbicacionFrontend, 
        x: number, 
        y: number, 
        width: number, 
        height: number
    ) => {
        const tieneProducto = ubicacionTieneProducto(ubicacion);
        const ubConStockParaModal = findUbicacionConStock(ubicacion.id_ubicacion);
        const isSelected = estanteSeleccionado?.id_ubicacion === ubicacion.id_ubicacion;
        const isHovered = hoveredUbicacion?.id_ubicacion === ubicacion.id_ubicacion;

        // Calcular tamaño del texto según el tamaño de la ubicación
        const fontSize = Math.min(12, Math.max(8, width / 8));

        return (
            <Group 
                key={ubicacion.id_ubicacion}
                onClick={() => setEstanteSeleccionado(ubConStockParaModal || null)}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                    setHoveredUbicacion(ubicacion);
                    setShowTooltip(true);
                    setTooltipPosition({
                        x: x + width / 2,
                        y: y - 20
                    });
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                    setHoveredUbicacion(null);
                    setShowTooltip(false);
                }}
            >
                <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={tieneProducto ? '#4CAF50' : getColorFondo(ubicacion)}
                    shadowColor={isSelected ? '#000000' : 'transparent'}
                    shadowBlur={isSelected ? 10 : 0}
                    opacity={isHovered ? 0.9 : 1}
                    cornerRadius={5}
                    stroke={getColorBorde(ubicacion)}
                    strokeWidth={isSelected ? 3 : 1}
                />
                <Text
                    x={x + 5}
                    y={y + 5}
                    text={ubicacion.codigo_legible || ''}
                    fontSize={fontSize}
                    fontFamily="Arial"
                    fill="#333333"
                    width={width - 10}
                    height={height - 10}
                    align="center"
                    verticalAlign="middle"
                />
                {ubicacion.capacidad && (
                    <Text
                        x={x + 5}
                        y={y + height - 20}
                        text={`Cap: ${ubicacion.capacidad}`}
                        fontSize={fontSize - 2}
                        fontFamily="Arial"
                        fill="#888888"
                        width={width - 10}
                        height={15}
                        align="right"
                    />
                )}
            </Group>
        );
    };

    const renderizarUbicaciones = () => {
        // Si no hay ubicaciones, renderizar ubicaciones de ejemplo para testing
        if (!ubicaciones || ubicaciones.length === 0) {
            console.warn('No hay ubicaciones para renderizar');
            return null;
        }

        // Filtramos ubicaciones con coordenadas válidas
        const ubicacionesConCoordenadas = ubicaciones.filter(ub => {
            const tieneCoordenadasValidas = 
                ub.pos_x !== null && 
                ub.pos_x !== undefined && 
                ub.pos_y !== null && 
                ub.pos_y !== undefined &&
                !isNaN(ub.pos_x) &&
                !isNaN(ub.pos_y);
            
            if (!tieneCoordenadasValidas) {
                console.warn(`Ubicación ${ub.codigo_legible} no tiene coordenadas válidas:`, ub);
            }
            
            return tieneCoordenadasValidas;
        });

        console.log('Ubicaciones con coordenadas válidas:', ubicacionesConCoordenadas);

        // Si no hay ubicaciones con coordenadas, crear una distribución automática
        if (ubicacionesConCoordenadas.length === 0) {
            console.log('Generando posiciones automáticas para las ubicaciones');
            const gridCols = Math.ceil(Math.sqrt(ubicaciones.length));
            const gridRows = Math.ceil(ubicaciones.length / gridCols);
            const cellWidth = Math.min(120, (width - 100) / gridCols);
            const cellHeight = Math.min(80, (height - 150) / gridRows);
            
            return ubicaciones.map((ubicacion, index) => {
                const col = index % gridCols;
                const row = Math.floor(index / gridCols);
                const x = 50 + col * (cellWidth + 10);
                const y = 60 + row * (cellHeight + 10);
                const w = cellWidth - 10;
                const h = cellHeight - 10;
                
                return renderizarUbicacion(ubicacion, x, y, w, h);
            });
        }

        // Renderizar ubicaciones con sus coordenadas definidas
        return ubicacionesConCoordenadas.map((ubicacion) => {
            const x = ubicacion.pos_x!;
            const y = ubicacion.pos_y!;
            const w = ubicacion.width || 100;
            const h = ubicacion.height || 60;
            
            // Verificar que las coordenadas estén dentro del canvas
            if (x < 0 || y < 0 || x + w > width || y + h > height) {
                console.warn(`Ubicación ${ubicacion.codigo_legible} está fuera del canvas:`, {x, y, w, h, width, height});
            }
            
            return renderizarUbicacion(ubicacion, x, y, w, h);
        });
    };

    const renderizarLeyenda = () => {
        const leyendaY = height - 60;
        const items = [
            { color: '#E3F2FD', texto: 'Estantería' },
            { color: '#FFF3E0', texto: 'Almacén' },
            { color: '#4CAF50', texto: 'Con Productos' }
        ];

        return items.map((item, index) => (
            <Group key={index}>
                <Rect
                    x={20 + index * 120}
                    y={leyendaY}
                    width={15}
                    height={15}
                    fill={item.color}
                    stroke="#BDBDBD"
                    strokeWidth={1}
                />
                <Text
                    x={40 + index * 120}
                    y={leyendaY + 2}
                    text={item.texto}
                    fontSize={12}
                    fontFamily="Arial"
                    fill="#333333"
                />
            </Group>
        ));
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Stage 
                width={width} 
                height={height}
                scaleX={zoomLevel}
                scaleY={zoomLevel}
                x={panX}
                y={panY}
                onWheel={handleWheel}
                draggable
                onDragEnd={handleStageDrag}
            >
                <Layer>
                    <Text 
                        text={productoId ? "Ubicaciones del Producto en el Almacén" : "Mapa del Almacén"} 
                        fontSize={16} 
                        fontStyle="bold"
                        x={20}
                        y={10}
                        fill="#333333"
                    />
                    <Text 
                        text="Arrastra para mover • Usa la rueda del mouse para hacer zoom • Las ubicaciones marcadas contienen productos"
                        fontSize={12}
                        x={20}
                        y={30}
                        fill="#666666"
                    />
                    {/* Fondo del canvas para debug */}
                    <Rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        fill="transparent"
                        stroke="#E0E0E0"
                        strokeWidth={1}
                        dash={[5, 5]}
                    />
                    {renderizarUbicaciones()}
                    {renderizarLeyenda()}
                    
                    {/* Tooltip para ubicaciones */}
                    {showTooltip && hoveredUbicacion && (
                        <Group>
                            <Rect
                                x={tooltipPosition.x - 100}
                                y={tooltipPosition.y - 20}
                                width={200}
                                height={60}
                                fill="rgba(255, 255, 255, 0.95)"
                                cornerRadius={5}
                                shadowColor="rgba(0, 0, 0, 0.2)"
                                shadowBlur={10}
                            />
                            <Text
                                x={tooltipPosition.x - 95}
                                y={tooltipPosition.y - 15}
                                text={hoveredUbicacion.codigo_legible || ''}
                                fontSize={12}
                                fontFamily="Arial"
                                fill="#333"
                            />
                            <Text
                                x={tooltipPosition.x - 95}
                                y={tooltipPosition.y}
                                text={`Capacidad: ${hoveredUbicacion.capacidad || 'N/A'}`}
                                fontSize={10}
                                fontFamily="Arial"
                                fill="#666"
                            />
                        </Group>
                    )}
                </Layer>
            </Stage>
            
            {/* Controles de zoom */}
            <Box sx={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000 }}>
                <IconButton onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}>
                    <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}>
                    <ZoomInIcon />
                </IconButton>
                <IconButton onClick={() => {
                    setZoomLevel(1);
                    setPanX(0);
                    setPanY(0);
                }}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            {/* Modal para detalles del estante */}
            {estanteSeleccionado && (
                <ModalEstanteDetalle
                    estante={estanteSeleccionado}
                    open={!!estanteSeleccionado}
                    onClose={() => setEstanteSeleccionado(null)}
                />
            )}
        </Box>
    );
};

export default MapaAlmacen;