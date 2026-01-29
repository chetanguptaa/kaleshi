import * as React from "react";
import { Input } from "@/components/ui/input";

type IntegerInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function IntegerInput({
  value,
  onValueChange,
  min = 1,
  max,
}: IntegerInputProps) {
  const [display, setDisplay] = React.useState<string | null>(
    value != null ? String(value) : null,
  );

  React.useEffect(() => {
    setDisplay(value != null ? String(value) : null);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;

    // Allow empty while typing
    if (val === "") {
      setDisplay("");
      return;
    }

    // Digits only
    if (!/^\d+$/.test(val)) return;

    const num = Number(val);

    // HARD CAP if max is provided
    if (max !== undefined && num > max) return;

    setDisplay(val);
    onValueChange(num);
  }

  function handleBlur() {
    let num = Number(display);

    if (Number.isNaN(num) || num < min) {
      num = min;
    }

    if (max !== undefined && num > max) {
      num = max;
    }

    onValueChange(num);
    setDisplay(String(num));
  }

  return (
    <Input
      placeholder={String(min)}
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
