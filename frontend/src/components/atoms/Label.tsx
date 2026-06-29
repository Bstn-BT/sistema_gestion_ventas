interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  texto: string;
}

export const Label = ({ texto, ...props }: LabelProps) => {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1" {...props}>
      {texto}
    </label>
  );
};