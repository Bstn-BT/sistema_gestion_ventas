import { FormularioComision } from '../components/organisms/FormularioComision';

export const NuevaComisionPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Nueva Comisión</h1>
        <p className="text-slate-500 text-sm mt-1">Registra los datos de tu nuevo encargo</p>
      </div>

      <FormularioComision />
    </div>
  );
};