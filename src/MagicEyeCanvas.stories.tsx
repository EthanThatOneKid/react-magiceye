import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo, useRef, useState } from "storybook/preview-api";
import { MagicEyeCanvas } from "./MagicEyeCanvas";
import type { MagicEyeCanvasProps } from "./types";

const imagePresets: Record<string, string> = {
  "Blue dot tile": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPSczJyBmaWxsPScjMWQ0ZWQ4Jy8+PC9zdmc+",
  "Raised circle depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48Y2lyY2xlIGN4PScxMScgY3k9JzknIHI9JzYnIGZpbGw9JyNmZmYnLz48L3N2Zz4=",
  "Grid pattern": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48cGF0aCBkPSdNMCAwaDIwdjIwSDB6JyBmaWxsPSdub25lJyBzdHJva2U9JyMxZDRlZDgnIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==",
  "Wavy depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48cGF0aCBkPSdNMCAxMGwxMCA4IDEwLTE2JyBmaWxsPSdub25lJyBzdHJva2U9JyNmZmYnIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==",
  "Checkerboard pattern": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48cmVjdCB4PScwJyB5PScwJyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIGZpbGw9JyMxZDRlZDgnLz48cmVjdCB4PScxMCcgeT0nMTAnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcgZmlsbD0nIzFkNGVkOCcvPjwvc3ZnPg==",
  "Bullseye depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPSc5JyBmaWxsPScjZmZmJy8+PGNpcmNsZSBjeD0nMTAnIGN5PScxMCcgcj0nNScgZmlsbD0nIzg4OCcvPjxjaXJjbGUgY3g9JzEwJyBjeT0nMTAnIHI9JzInIGZpbGw9JyNmZmYnLz48L3N2Zz4=",
  "Custom...": "",
};

type StoryArgs = Omit<MagicEyeCanvasProps, "pattern" | "depth"> & {
  pattern: string;
  depth: string;
};

function ImagePreview({ label, src }: { label: string; src: string }) {
  if (!src) {
    return null;
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>{label}</strong>
      <img
        src={src}
        alt={label}
        style={{
          width: 120,
          height: 120,
          imageRendering: "pixelated",
          border: "1px solid #d0d7de",
          background: "#fff",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

function FileUpload({ label, onFile }: { label: string; onFile: (dataUrl: string) => void }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      border: "1px dashed #d0d7de",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      color: "#59636e",
    }}>
      {`Upload ${label}`}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onFile(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
    </label>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px solid #d0d7de",
  borderRadius: 6,
  background: "#f6f8fa",
  fontSize: 14,
  cursor: "pointer",
  color: "#1f2328",
  fontFamily: "system-ui, sans-serif",
};

const meta: Meta<StoryArgs> = {
  title: "MagicEye/MagicEyeCanvas",
  component: MagicEyeCanvas,
  args: {
    pattern: "Blue dot tile",
    depth: "Raised circle depth",
    width: 640,
    height: 480,
    eyeSeparation: 96,
    depthStrength: 0.75,
    blurRadius: 2,
    invertDepth: false,
    algorithm: "phase",
    subpixel: false,
    occlude: true,
    occlusionMode: "range-overlap",
  },
  argTypes: {
    pattern: {
      control: "select",
      options: Object.keys(imagePresets),
    },
    depth: {
      control: "select",
      options: Object.keys(imagePresets),
    },
    width: {
      control: { type: "range", min: 100, max: 1200, step: 10 },
    },
    height: {
      control: { type: "range", min: 100, max: 900, step: 10 },
    },
    eyeSeparation: {
      control: { type: "range", min: 1, max: 300, step: 1 },
      description: "Controls eye spacing. Higher = deeper effect, lower = flatter.",
    },
    depthStrength: {
      control: { type: "range", min: 0, max: 2, step: 0.01 },
      description: "How strongly depth shifts the pattern. 0 = flat, 1 = normal, 2 = exaggerated.",
    },
    blurRadius: {
      control: { type: "range", min: 0, max: 20, step: 1 },
      description: "Blur applied to the depth map. Smoother transitions at higher values.",
    },
    invertDepth: {
      control: "boolean",
      description: "Swap near and far. Makes indented shapes pop out and vice versa.",
    },
    patternRepeatWidth: {
      control: { type: "range", min: 1, max: 200, step: 1 },
      description: "Override the pattern tile width. Wider = pattern repeats less often.",
    },
    algorithm: {
      control: "select",
      options: ["phase", "classic", "thimbleby"],
      description: "Rendering algorithm. Phase = pattern offset, Classic = left-to-right copy, Thimbleby = occlusion-aware.",
    },
    subpixel: {
      control: "boolean",
      description: "Bilinear interpolation for sub-pixel shifts. Sharper at depth edges.",
    },
    occlude: {
      control: "boolean",
      description: "Enable occlusion detection (Thimbleby only). Hides background pixels behind foreground.",
    },
    occlusionMode: {
      control: "select",
      options: ["range-overlap", "shortest-link"],
      description: "Occlusion resolution strategy (Thimbleby only).",
    },
    pipeline: {
      table: { disable: true },
    },
    onRendered: {
      table: { disable: true },
    },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => {
    const [customPattern, setCustomPattern] = useState<string | null>(null);
    const [customDepth, setCustomDepth] = useState<string | null>(null);
    const [renderedCanvas, setRenderedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const patternSource = imagePresets[args.pattern] || customPattern || imagePresets["Blue dot tile"];
    const depthSource = imagePresets[args.depth] || customDepth || imagePresets["Raised circle depth"];
    const showCustomPattern = args.pattern === "Custom...";
    const showCustomDepth = args.depth === "Custom...";

    const controls = useMemo(() => ({
      eyeSeparation: args.eyeSeparation,
      depthStrength: args.depthStrength,
      blurRadius: args.blurRadius,
      invertDepth: args.invertDepth,
      patternRepeatWidth: args.patternRepeatWidth,
      subpixel: args.subpixel,
      algorithm: args.algorithm,
      occlude: args.occlude,
      occlusionMode: args.occlusionMode,
    }), [args.eyeSeparation, args.depthStrength, args.blurRadius, args.invertDepth, args.patternRepeatWidth, args.subpixel, args.algorithm, args.occlude, args.occlusionMode]);

    const handleRendered = useCallback((canvas: HTMLCanvasElement) => {
      setRenderedCanvas(canvas);
    }, []);

    const handleDownload = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "magic-eye.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }, []);

    const handleCopyConfig = useCallback(() => {
      const config = {
        pattern: args.pattern,
        depth: args.depth,
        width: args.width,
        height: args.height,
        eyeSeparation: args.eyeSeparation,
        depthStrength: args.depthStrength,
        blurRadius: args.blurRadius,
        invertDepth: args.invertDepth,
        patternRepeatWidth: args.patternRepeatWidth,
      };
      navigator.clipboard.writeText(JSON.stringify(config, null, 2)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, [args]);

    return (
      <div style={{ display: "grid", gap: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <ImagePreview label={`Pattern: ${args.pattern}`} src={patternSource} />
          <ImagePreview label={`Depth map: ${args.depth}`} src={depthSource} />
          {showCustomPattern && (
            <FileUpload label="pattern image" onFile={setCustomPattern} />
          )}
          {showCustomDepth && (
            <FileUpload label="depth image" onFile={setCustomDepth} />
          )}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong>Rendered Magic Eye</strong>
            <button type="button" style={btnStyle} onClick={handleDownload}>
              Download PNG
            </button>
            <button type="button" style={btnStyle} onClick={handleCopyConfig}>
              {copied ? "Copied!" : "Copy config"}
            </button>
          </div>
          <MagicEyeCanvas
            ref={canvasRef}
            pattern={patternSource}
            depth={depthSource}
            width={args.width}
            height={args.height}
            onRendered={handleRendered}
            style={{ border: "1px solid #d0d7de", maxWidth: "100%", height: "auto" }}
            {...controls}
          />
        </div>
      </div>
    );
  },
};

interface Preset {
  label: string;
  description: string;
  pattern: string;
  depth: string;
  width: number;
  height: number;
  eyeSeparation?: number;
  depthStrength?: number;
  blurRadius?: number;
  invertDepth?: boolean;
  patternRepeatWidth?: number;
  subpixel?: boolean;
  algorithm?: "phase" | "classic" | "thimbleby";
  occlude?: boolean;
  occlusionMode?: "range-overlap" | "shortest-link";
}

const presets: Preset[] = [
  {
    label: "Easy Focus",
    description: "High depth strength, clear separation, smooth blur. Good for first-time viewers.",
    pattern: "Blue dot tile",
    depth: "Raised circle depth",
    width: 300, height: 300,
    eyeSeparation: 120, depthStrength: 1.2, blurRadius: 3,
  },
  {
    label: "Smooth Depth",
    description: "Heavy blur creates gradual, gentle depth transitions.",
    pattern: "Grid pattern",
    depth: "Wavy depth",
    width: 300, height: 300,
    eyeSeparation: 96, depthStrength: 0.8, blurRadius: 10,
  },
  {
    label: "Deep Cut",
    description: "Inverted depth with high separation. Indented shapes pop out aggressively.",
    pattern: "Checkerboard pattern",
    depth: "Bullseye depth",
    width: 300, height: 300,
    eyeSeparation: 160, depthStrength: 1.5, blurRadius: 1, invertDepth: true,
  },
  {
    label: "Subtle Illusion",
    description: "Low depth strength with wide pattern repeat. A gentle 3D effect.",
    pattern: "Blue dot tile",
    depth: "Raised circle depth",
    width: 300, height: 300,
    eyeSeparation: 80, depthStrength: 0.3, blurRadius: 4, patternRepeatWidth: 80,
  },
  {
    label: "Hard Mode",
    description: "Sharp depth map, weak separation, small pattern. Takes patience to see.",
    pattern: "Checkerboard pattern",
    depth: "Raised circle depth",
    width: 300, height: 300,
    eyeSeparation: 40, depthStrength: 0.5, blurRadius: 0,
  },
  {
    label: "Wide Angle",
    description: "Large eye separation and strong depth. The illusion jumps out fast.",
    pattern: "Grid pattern",
    depth: "Bullseye depth",
    width: 300, height: 300,
    eyeSeparation: 200, depthStrength: 1.8, blurRadius: 2,
  },
  {
    label: "Cross-Eyed",
    description: "Inverted depth for cross-eyed viewing. Pop-outs become indents.",
    pattern: "Blue dot tile",
    depth: "Raised circle depth",
    width: 300, height: 300,
    eyeSeparation: 96, depthStrength: 0.75, blurRadius: 2, invertDepth: true,
  },
  {
    label: "Thimbleby Occlusion",
    description: "Occlusion-aware rendering with classic algorithm. Handles overlapping depth layers.",
    pattern: "Blue dot tile",
    depth: "Bullseye depth",
    width: 300, height: 300,
    eyeSeparation: 96, depthStrength: 0.75, blurRadius: 2,
    algorithm: "thimbleby" as const, subpixel: true,
  },
];

export const Gallery: Story = {
  name: "Preset Gallery",
  parameters: { controls: { hideNoControlsWarning: true } },
  argTypes: {
    pattern: { table: { disable: true } },
    depth: { table: { disable: true } },
    width: { table: { disable: true } },
    height: { table: { disable: true } },
    eyeSeparation: { table: { disable: true } },
    depthStrength: { table: { disable: true } },
    blurRadius: { table: { disable: true } },
    invertDepth: { table: { disable: true } },
    patternRepeatWidth: { table: { disable: true } },
    algorithm: { table: { disable: true } },
    subpixel: { table: { disable: true } },
    occlude: { table: { disable: true } },
    occlusionMode: { table: { disable: true } },
    pipeline: { table: { disable: true } },
    onRendered: { table: { disable: true } },
  },
  render: () => (
    <div style={{ display: "grid", gap: 32, fontFamily: "system-ui, sans-serif", maxWidth: 1000 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Preset Gallery</h2>
      <p style={{ margin: 0, color: "#59636e", fontSize: 14 }}>
        Pre-configured combinations to show what the engine can do.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {presets.map((p) => (
          <div key={p.label} style={{
            display: "grid",
            gap: 8,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            padding: 16,
            background: "#fff",
          }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</div>
            <div style={{ fontSize: 13, color: "#59636e", maxWidth: 300 }}>{p.description}</div>
            <MagicEyeCanvas
              pattern={imagePresets[p.pattern]}
              depth={imagePresets[p.depth]}
              width={p.width}
              height={p.height}
              eyeSeparation={p.eyeSeparation}
              depthStrength={p.depthStrength}
              blurRadius={p.blurRadius}
              invertDepth={p.invertDepth}
              patternRepeatWidth={p.patternRepeatWidth}
              subpixel={p.subpixel}
              algorithm={p.algorithm}
              occlude={p.occlude}
              occlusionMode={p.occlusionMode}
              style={{ border: "1px solid #e1e4e8", borderRadius: 4 }}
            />
          </div>
        ))}
      </div>
    </div>
  ),
};
