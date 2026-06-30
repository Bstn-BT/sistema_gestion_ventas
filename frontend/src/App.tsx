import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NuevaComisionPage } from './pages/NuevaComisionPage';
import { HistorialPage } from './pages/HistorialPage';
import { CatalogoPage } from './pages/CatalogoPage';

function App() {
  return (
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
  );
}

export default App;