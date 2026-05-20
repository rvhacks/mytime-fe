import { useState, useRef, useEffect, useCallback } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#1e293b', '#64748b',
  '#f43f5e', '#a855f7', '#0ea5e9', '#10b981',
];

function hexToHSL(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#6366f1');
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Initialize from value
  useEffect(() => {
    if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
      const [h, s, l] = hexToHSL(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setHexInput(value);
    }
  }, [value]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateColor = useCallback((h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  // Gradient area: saturation (x) and lightness (y)
  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newS = x * 100;
    const newL = (1 - y) * 100;
    setSaturation(newS);
    setLightness(newL);
    updateColor(hue, newS, newL);
  };

  const handleGradientDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleGradientClick(e);
  };

  // Hue bar
  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newHue = x * 360;
    setHue(newHue);
    updateColor(newHue, saturation, lightness);
  };

  const handleHueDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleHueClick(e);
  };

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const [h, s, l] = hexToHSL(val);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      onChange(val);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger swatch */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl border-2 border-[var(--input-border)] shadow-sm transition-all hover:scale-105 hover:shadow-md"
        style={{ backgroundColor: value || '#6366f1' }}
        title={value || '#6366f1'}
      />

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-[var(--card-bg)] border border-[var(--border-secondary)] rounded-xl shadow-2xl p-3 w-[260px]">
          {/* Saturation/Lightness gradient */}
          <div
            ref={gradientRef}
            className="w-full h-[140px] rounded-lg cursor-crosshair relative overflow-hidden mb-3"
            style={{
              background: `linear-gradient(to bottom, #fff, #000), linear-gradient(to right, #808080, hsl(${hue}, 100%, 50%))`,
              backgroundBlendMode: 'multiply',
            }}
            onClick={handleGradientClick}
            onMouseMove={handleGradientDrag}
          >
            {/* Cursor */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                backgroundColor: hexInput,
              }}
            />
          </div>

          {/* Hue bar */}
          <div
            ref={hueRef}
            className="w-full h-3 rounded-full cursor-pointer relative mb-3"
            style={{
              background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
            onClick={handleHueClick}
            onMouseMove={handleHueDrag}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                backgroundColor: `hsl(${hue}, 100%, 50%)`,
              }}
            />
          </div>

          {/* Hex input + preview */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg border border-[var(--border-secondary)] shrink-0"
              style={{ backgroundColor: hexInput }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              maxLength={7}
              className="flex-1 h-8 px-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="#000000"
            />
          </div>

          {/* Preset swatches */}
          <div className="grid grid-cols-8 gap-1.5">
            {PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  const [h, s, l] = hexToHSL(color);
                  setHue(h); setSaturation(s); setLightness(l);
                  setHexInput(color);
                  onChange(color);
                }}
                className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${
                  value === color ? 'border-white shadow-md ring-2 ring-brand-500' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
