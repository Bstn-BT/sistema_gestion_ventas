import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NuevaComisionPage } from './pages/NuevaComisionPage';
import { HistorialPage } from './pages/HistorialPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      {/* Configuración global de las notificaciones Toast */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b', // Fondo slate-800 elegante
            color: '#f8fafc',      // Texto blanco
            borderRadius: '12px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#22c55e', // Checkmark verde
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // X roja
              secondary: '#fff',
            },
          },
        }} 
      />

      {/* Tu enrutador original intacto */}
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/nueva-comision" element={<NuevaComisionPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </>
  );
}

export default App;