import { useForm, Controller } from "react-hook-form";

export function TestImport() {
  const { control } = useForm();
  
  return (
    <div>
      <Controller
        control={control}
        name="test"
        render={({ field }) => <input {...field} />}
      />
    </div>
  );
} 