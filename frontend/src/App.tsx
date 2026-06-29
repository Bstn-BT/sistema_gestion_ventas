import { InputDolar } from './components/molecules/InputDolar';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Nueva Comisión
        </h1>
        
        {/* Molecule inyectada */}
        <InputDolar />
        
      </div>
    </div>
  );
}

export default App;