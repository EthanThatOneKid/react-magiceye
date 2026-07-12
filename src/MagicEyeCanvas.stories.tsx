import type { Meta, StoryObj } from "@storybook/react";
import { MagicEyeCanvas } from "./MagicEyeCanvas";
import type { MagicEyeCanvasProps } from "./types";

const imagePresets = {
  "Blue dot tile": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPSczJyBmaWxsPScjMWQ0ZWQ4Jy8+PC9zdmc+",
  "Raised circle depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48Y2lyY2xlIGN4PScxMScgY3k9JzknIHI9JzYnIGZpbGw9JyNmZmYnLz48L3N2Zz4=",
  "Grid pattern": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48cGF0aCBkPSdNMCAwaDIwdjIwSDB6JyBmaWxsPSdub25lJyBzdHJva2U9JyMxZDRlZDgnIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==",
  "Wavy depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48cGF0aCBkPSdNMCAxMGwxMCA4IDEwLTE2JyBmaWxsPSdub25lJyBzdHJva2U9JyNmZmYnIHN0cm9rZS13aWR0aD0nMicvPjwvc3ZnPg==",
  "Checkerboard pattern": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyNmZmYnLz48cmVjdCB4PScwJyB5PScwJyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnIGZpbGw9JyMxZDRlZDgnLz48cmVjdCB4PScxMCcgeT0nMTAnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcgZmlsbD0nIzFkNGVkOCcvPjwvc3ZnPg==",
  "Bullseye depth": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyM4ODgnLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPSc5JyBmaWxsPScjZmZmJy8+PGNpcmNsZSBjeD0nMTAnIGN5PScxMCcgcj0nNScgZmlsbD0nIzg4OCcvPjxjaXJjbGUgY3g9JzEwJyBjeT0nMTAnIHI9JzInIGZpbGw9JyNmZmYnLz48L3N2Zz4=",
} as const;

type ImagePreset = keyof typeof imagePresets;
type StoryArgs = Omit<MagicEyeCanvasProps, "pattern" | "depth"> & {
  pattern: ImagePreset;
  depth: ImagePreset;
};

function ImagePreview({ label, src }: { label: string; src: string }) {
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
        }}
      />
    </div>
  );
}

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
  render: ({ pattern, depth, ...args }) => {
    const patternSource = imagePresets[pattern];
    const depthSource = imagePresets[depth];

    return (
      <div style={{ display: "grid", gap: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <ImagePreview label={`Pattern: ${pattern}`} src={patternSource} />
          <ImagePreview label={`Depth map: ${depth}`} src={depthSource} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong>Rendered Magic Eye</strong>
          <MagicEyeCanvas
            {...args}
            pattern={patternSource}
            depth={depthSource}
            style={{ border: "1px solid #d0d7de", maxWidth: "100%", height: "auto" }}
          />
        </div>
      </div>
    );
  },
};
