interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = ({ label, ...props }: CheckboxProps) => {
  return (
    <label className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
      <input 
        type="checkbox" 
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
        {...props} 
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};