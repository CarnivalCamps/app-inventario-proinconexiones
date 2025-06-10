// client-web/src/App.tsx
import React from 'react';
import AppRoutes from './router/AppRoutes';
import './App.css'; // Puedes mantener o modificar los estilos de App.css

const App: React.FC = () => {
  return (
    <div>
      {/* Aquí podríamos poner un Layout general (Navbar, Sidebar) en el futuro */}
      <header>
        <h1>Almacenes</h1>
        {/* Podríamos poner enlaces de navegación aquí más adelante */}
      </header>
      <main>
        <AppRoutes />
      </main>
      <footer>
        <p>&copy; 2025 Proival Group</p>
      </footer>
    </div>
  );
}

export default App;