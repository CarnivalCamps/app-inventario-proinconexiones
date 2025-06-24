// client-web/src/layouts/MainLayout.tsx
import React from 'react';
import { Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, IconButton, CssBaseline, StepConnector } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


// Importar iconos de MUI
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { LocationOn } from '@mui/icons-material';

const drawerWidth = 240;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
        { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes' },
        { text: 'Conteos Físicos', icon: <RuleFolderIcon />, path: '/conteos' },
        { text: 'Historial Movimientos', icon: <HistoryIcon />, path: '/historial-movimientos' },
        { text: 'Órdenes de Compra', icon: <ShoppingCartIcon />, path: '/ordenes-compra' }, 
        { text: 'Gestionar Ubicaciones', icon: <LocationOn />, path: '/ubicaciones' }, 
        
    ];

    const managementItems = [
        { text: 'Categorías', icon: <CategoryIcon />, path: '/categorias' },
        { text: 'Unidades de Medida', icon: <SquareFootIcon />, path: '/unidades-medida' },
        { text: 'Proveedores', icon: <PeopleAltIcon />, path: '/proveedores' },
    ];

    const drawerContent = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Menú Principal
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding component={RouterLink} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
                        <ListItemButton>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <Typography variant="overline" sx={{ pl: 2 }}>Gestión de Catálogos</Typography>
                {managementItems.map((item) => (
                    <ListItem key={item.text} disablePadding component={RouterLink} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
                        <ListItemButton>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Sistema de Inventario
                    </Typography>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                        Hola, {user?.nombre_usuario} ({user?.rol})
                    </Typography>
                    <IconButton color="inherit" onClick={logout} title="Cerrar Sesión">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Drawer para vista móvil */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Mejora el rendimiento en móviles.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Drawer para vista de escritorio */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar /> {/* Un espacio para que el contenido no quede debajo del AppBar */}
                {children} {/* Aquí se renderizará cada página (Dashboard, Productos, etc.) */}
            </Box>
        </Box>
    );
}

export default MainLayout;