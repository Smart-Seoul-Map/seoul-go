import { useEffect, useState, type ChangeEvent, type ReactElement } from "react";

type IntroLayoutCoordinateInputProps = {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
};

const DEFAULT_COORDINATE_STEP = 0.1;

export function IntroLayoutCoordinateInput({
  label,
  value,
  step = DEFAULT_COORDINATE_STEP,
  onChange,
}: IntroLayoutCoordinateInputProps): ReactElement {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText((current) => (parseCoordinate(current) === value ? current : String(value)));
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextText = event.target.value;
    const nextValue = parseCoordinate(nextText);

    setText(nextText);

    if (nextValue !== null) {
      onChange(nextValue);
    }
  };

  return (
    <label className="IntroLayoutCoordinateInput">
      <span>{label}</span>
      <input type="number" step={step} value={text} onChange={handleChange} />
    </label>
  );
}

function parseCoordinate(text: string): number | null {
  const value = Number(text);

  return text.trim() !== "" && Number.isFinite(value) ? value : null;
}
