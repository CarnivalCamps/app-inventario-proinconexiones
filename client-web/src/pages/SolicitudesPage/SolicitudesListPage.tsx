// client-web/src/pages/SolicitudesPage/SolicitudesListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSolicitudes} from '../../services/solicitudService';
import type { SolicitudReservaFrontend } from '../../services/solicitudService';
// import './SolicitudesListPage.css';

const SolicitudesListPage: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<SolicitudReservaFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getSolicitudes();
                setSolicitudes(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSolicitudes();
    }, []);

    

    if (isLoading) return <p>Cargando solicitudes...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Solicitudes de Reserva</h2>
            <Link to="/solicitudes/nueva"> {/* <--- BOTÓN/ENLACE PARA CREAR */}
                <button style={{ marginBottom: '20px', padding: '10px' }}>Crear Nueva Solicitud</button>
            </Link>

            {solicitudes.length === 0 ? (
                <p>No hay solicitudes para mostrar.</p>
            ) : (
                <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha Solicitud</th>
                            <th>Propósito</th>
                            <th>Solicitante (Vendedor)</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitudes.map((sol) => (
                            <tr key={sol.id_solicitud}>
                                <td>{sol.id_solicitud}</td>
                                <td>{new Date(sol.fecha_solicitud).toLocaleDateString()}</td>
                                <td>{sol.proposito_solicitud}</td>
                                <td>{sol.vendedor?.nombre_usuario || 'N/A'}</td>
                                <td>{sol.estado_solicitud}</td>
                                <td>
                                    <Link to={`/solicitudes/${sol.id_solicitud}`}>
                                        <button>Ver Detalles</button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SolicitudesListPage;