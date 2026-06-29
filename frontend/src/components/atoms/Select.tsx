interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  opciones: { id: number; nombre: string }[];
}

export const Select = ({ opciones, ...props }: SelectProps) => {
  return (
    <select 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      {...props}
    >
      <option value="">Selecciona una opción</option>
      {opciones.map((opcion) => (
        <option key={opcion.id} value={opcion.id}>
          {opcion.nombre}
        </option>
      ))}
    </select>
  );
};