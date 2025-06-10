// client-web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // <--- IMPORTA
import CssBaseline from '@mui/material/CssBaseline'; // <--- IMPORTA
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';

// 1. Opcional: Crear un tema básico para MUI
const theme = createTheme({
  palette: {
    // mode: 'dark', // Descomenta esta línea si prefieres un tema oscuro
    primary: {
      main: '#1976d2', // Un azul como color primario
    },
    secondary: {
      main: '#dc004e', // Un rosa/rojo como secundario
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* 2. Envolver la app con los proveedores de MUI */}
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Normaliza los estilos y aplica el color de fondo del tema */}
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)