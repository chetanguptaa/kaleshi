import * as React from "react";
import { Input } from "@/components/ui/input";

type DecimalInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
};

export function DecimalInput({
  value,
  onValueChange,
  min = 0.01,
}: DecimalInputProps) {
  const [display, setDisplay] = React.useState(value.toFixed(2));

  React.useEffect(() => {
    setDisplay(value.toFixed(2));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;

    // Allow empty, digits, and up to 2 decimals while typing
    if (!/^\d*\.?\d{0,2}$/.test(val)) return;

    setDisplay(val);

    const num = Number(val);
    if (!Number.isNaN(num)) {
      onValueChange(num);
    }
  }

  function handleBlur() {
    let num = Number(display);

    if (Number.isNaN(num) || num < min) {
      num = min;
    }

    onValueChange(num);
    setDisplay(num.toFixed(2));
  }

  return (
    <Input
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
