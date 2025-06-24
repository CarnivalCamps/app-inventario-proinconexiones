
import React from 'react'; // Ya no necesitamos useEffect ni useState para la carga de productos
import { Box, Typography, Modal, IconButton, Grid } from '@mui/material'; // Quitamos CircularProgress
import CloseIcon from '@mui/icons-material/Close';
import type { UbicacionConStock } from '../../services/ubicacionService'; // Importamos UbicacionConStock

/**
 * Interfaz para los productos que se encuentran en una ubicación.
 * Ahora viene directamente de UbicacionConStock
 */
interface ProductoEnUbicacionDetalle {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  sku: string;
  // No necesitamos posicion_en_slot aquí si solo listamos los productos
}

/**
 * Props para el componente ModalEstanteDetalle.
 * 'open' controla la visibilidad del modal.
 * 'estante' es el objeto de la ubicación a detallar, ahora con stock.
 * 'onClose' es la función para cerrar el modal.
 */
interface Props {
  open: boolean;
  estante: UbicacionConStock | null; // Cambiado a UbicacionConStock
  onClose: () => void;
}

/**
 * Componente visual para un único slot en el estante.
 * Cambia de color según si está ocupado o no.
 */
const Slot = ({ ocupado }: { ocupado: boolean }) => (
  <Box 
    sx={{ 
      width: '30px', 
      height: '30px', 
      backgroundColor: ocupado ? 'primary.main' : 'grey.200', 
      border: '1px solid white'
    }} 
  />
);

/**
 * Componente de Modal que muestra el detalle de un estante, incluyendo sus niveles
 * y la ocupación de los slots en cada uno, y los productos que contiene.
 */
const ModalEstanteDetalle: React.FC<Props> = ({ open, estante, onClose }) => {
  // No necesitamos estados de carga ni error aquí, ya que los datos vienen pre-cargados
  // y el manejo de errores se hace en la página que llama a este modal.

  // Si no hay un estante seleccionado, el componente no renderiza nada.
  if (!estante) {
    return null;
  }

  // Aplanar los productos de todos los sub-niveles para mostrarlos en una lista única
  const todosLosProductosEnEstante: ProductoEnUbicacionDetalle[] = [];
  const aplanarProductos = (ubicacion: UbicacionConStock) => {
    if (ubicacion.productos_en_ubicacion) {
      todosLosProductosEnEstante.push(...ubicacion.productos_en_ubicacion);
    }
    if (ubicacion.hijos) {
      ubicacion.hijos.forEach(hijo => aplanarProductos(hijo as UbicacionConStock)); // Recursivamente para hijos
    }
  };

  aplanarProductos(estante); // Llenar la lista con los productos del estante y sus hijos

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ 
        p: 4, 
        bgcolor: 'background.paper', 
        margin: 'auto', 
        mt: '10vh', 
        maxWidth: '80vw', 
        maxHeight: '80vh', 
        overflowY: 'auto', // Permite scroll si el contenido es muy largo
        position: 'relative',
        borderRadius: '8px'
      }}>
        <Typography variant="h5" gutterBottom>
          Detalle de Ubicación: {estante.nombre}
        </Typography>
        <IconButton 
          aria-label="close"
          onClick={onClose} 
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
        <hr />

        <Box sx={{ mt: 2 }}>
          {estante.hijos?.length === 0 && !estante.productos_en_ubicacion?.length ? (
              <Typography sx={{ my: 4, textAlign: 'center', color: 'text.secondary' }}>
                Esta ubicación no tiene sub-ubicaciones ni productos directos.
              </Typography>
          ) : (
            <>
              {/* Mostrar productos directos en esta ubicación */}
              {estante.productos_en_ubicacion && estante.productos_en_ubicacion.length > 0 && (
                <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <Typography variant="h6">Productos en esta Ubicación</Typography>
                  {estante.productos_en_ubicacion.map(p => (
                    <Typography key={p.id_producto} variant="body2">
                      - {p.nombre_producto} (SKU: {p.sku}): {p.cantidad} unidades
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Mostrar sub-ubicaciones y sus productos */}
              {estante.hijos?.map(nivel => {
                const nivelConStock = nivel as UbicacionConStock; // Castear para acceder a productos_en_ubicacion
                const filas = nivelConStock.slot_filas || 1;
                const columnas = nivelConStock.slot_columnas || 10;
                const totalSlots = filas * columnas;

                // Aquí la lógica de slots es más compleja si queremos mapear productos a slots específicos.
                // Por ahora, solo indicaremos si el nivel tiene productos.
                const tieneProductosEnNivel = nivelConStock.productos_en_ubicacion && nivelConStock.productos_en_ubicacion.length > 0;

                return (
                    <Box key={nivel.id_ubicacion} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <Typography variant="h6">{nivel.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tipo: {nivel.tipo || 'N/A'} | Código: {nivel.codigo_legible || 'N/A'}
                    </Typography>
                    {tieneProductosEnNivel ? (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Productos en este nivel:</Typography>
                            {nivelConStock.productos_en_ubicacion?.map(p => (
                                <Typography key={p.id_producto} variant="body2">
                                    - {p.nombre_producto} (SKU: {p.sku}): {p.cantidad} unidades
                                </Typography>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            No hay productos directos en este nivel.
                        </Typography>
                    )}
                    {/* Si queremos mostrar la cuadrícula de slots, necesitaríamos la 'posicion_en_slot' en el backend */}
                    {/* <Grid container spacing={0.5} sx={{ mt: 1 }}>
                        {Array.from({ length: totalSlots }).map((_, index) => (
                        <Grid item xs="auto" key={index}>
                            <Slot ocupado={false} /> // Lógica de ocupación más compleja
                        </Grid>
                        ))}
                    </Grid> */}
                    </Box>
                );
              })}
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalEstanteDetalle;
