"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export type ColorPickerProps = {
  className?: string;
  disabled?: boolean;
  gradient?: boolean;
  gradientLabels?: { end: string; gradient: string; start: string };
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onGradientChange?: (gradient: string) => void;
};

function isGradient(value: string): boolean {
  return value.includes("gradient(");
}

/** Extract color values from a gradient string. Handles hex, rgb(), and rgba(). */
function parseGradientColors(gradient: string): { end: string; start: string } {
  const colorPattern = /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g;
  const colors = gradient.match(colorPattern) ?? [];
  return {
    end: colors[1] ?? colors[0] ?? "#000000",
    start: colors[0] ?? "#000000",
  };
}

export const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  const {
    className,
    disabled = false,
    gradient = false,
    gradientLabels,
    label,
    onChange,
    onGradientChange,
    value,
  } = props;

  const gl = gradientLabels ?? { end: "End", gradient: "Gradient", start: "Start" };

  const [useGradient, setUseGradient] = React.useState(() => isGradient(value));
  const [gradientColors, setGradientColors] = React.useState(() => parseGradientColors(value));

  const solidColor = isGradient(value) ? parseGradientColors(value).start : value;

  const handleSolidChange = React.useCallback(
    (color: string) => {
      onChange(color);
    },
    [onChange],
  );

  const handleGradientToggle = React.useCallback(
    (checked: boolean) => {
      setUseGradient(checked);
      if (checked) {
        const grad = `linear-gradient(160deg, ${gradientColors.start} 0%, ${gradientColors.end} 100%)`;
        onGradientChange?.(grad);
      } else {
        onChange(gradientColors.start);
      }
    },
    [gradientColors, onChange, onGradientChange],
  );

  const handleGradientColorChange = React.useCallback(
    (which: "end" | "start", color: string) => {
      const updated = { ...gradientColors, [which]: color };
      setGradientColors(updated);
      const grad = `linear-gradient(160deg, ${updated.start} 0%, ${updated.end} 100%)`;
      onGradientChange?.(grad);
    },
    [gradientColors, onGradientChange],
  );

  const handleSolidColorInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSolidChange(e.target.value);
    },
    [handleSolidChange],
  );

  const handleGradientToggleInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleGradientToggle(e.target.checked);
    },
    [handleGradientToggle],
  );

  const handleGradientStartColorInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleGradientColorChange("start", e.target.value);
    },
    [handleGradientColorChange],
  );

  const handleGradientEndColorInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleGradientColorChange("end", e.target.value);
    },
    [handleGradientColorChange],
  );

  const inputId = React.useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label != null && (
        <label className="text-muted-foreground text-xs font-medium" htmlFor={inputId}>
          {label}
        </label>
      )}

      {!useGradient && (
        <div className="flex items-center gap-2">
          <input
            className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
            disabled={disabled}
            id={inputId}
            onChange={handleSolidColorInput}
            type="color"
            value={solidColor.startsWith("#") ? solidColor.slice(0, 7) : "#000000"}
          />
          <input
            aria-label={label ?? "Color value"}
            className="bg-input text-foreground h-8 flex-1 rounded-md border px-2 font-mono text-xs"
            disabled={disabled}
            onChange={handleSolidColorInput}
            placeholder="#000000"
            type="text"
            value={solidColor}
          />
        </div>
      )}

      {gradient && (
        <label className="flex items-center gap-2 text-xs">
          <input checked={useGradient} disabled={disabled} onChange={handleGradientToggleInput} type="checkbox" />
          {gl.gradient}
        </label>
      )}

      {useGradient && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-10 text-xs">{gl.start}</span>
            <input
              className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
              disabled={disabled}
              onChange={handleGradientStartColorInput}
              type="color"
              value={gradientColors.start}
            />
            <input
              className="bg-input text-foreground h-8 flex-1 rounded-md border px-2 font-mono text-xs"
              disabled={disabled}
              onChange={handleGradientStartColorInput}
              type="text"
              value={gradientColors.start}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-10 text-xs">{gl.end}</span>
            <input
              className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
              disabled={disabled}
              onChange={handleGradientEndColorInput}
              type="color"
              value={gradientColors.end}
            />
            <input
              className="bg-input text-foreground h-8 flex-1 rounded-md border px-2 font-mono text-xs"
              disabled={disabled}
              onChange={handleGradientEndColorInput}
              type="text"
              value={gradientColors.end}
            />
          </div>
        </div>
      )}
    </div>
  );
};
