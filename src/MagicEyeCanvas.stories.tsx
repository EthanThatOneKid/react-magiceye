import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";
import { MagicEyeCanvas } from "./MagicEyeCanvas";
import type { MagicEyeCanvasProps } from "./MagicEyeCanvas";
import { SCENES } from "./procedural";
import type { SceneDef, ScenePalette } from "./procedural";

type StoryArgs = Pick<
  MagicEyeCanvasProps,
  "width" | "height" | "eyeSeparation" | "mu" | "seed" | "showDepth" | "palette"
> & {
  sceneId: string;
};

const sceneOptions = SCENES.map((s) => s.id);

function sceneFor(sceneId: string): SceneDef {
  return SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
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
  args: {
    sceneId: "sphere",
    width: 640,
    height: 480,
    palette: "dots",
    eyeSeparation: undefined,
    mu: undefined,
    seed: 1337,
    showDepth: false,
  },
  argTypes: {
    sceneId: {
      control: "select",
      options: sceneOptions,
      description: "Depth map to render. Choose “custom” below to supply your own DepthFn.",
    },
    palette: {
      control: "select",
      options: ["dots", "rainbow", "candy", "mono"],
      description: "Pattern flavor. Dots = classic high-contrast random dots.",
    },
    width: { control: { type: "range", min: 100, max: 1200, step: 10 } },
    height: { control: { type: "range", min: 100, max: 900, step: 10 } },
    eyeSeparation: {
      control: { type: "range", min: 20, max: 400, step: 1 },
      description: "Eye separation in pixels. Larger = pattern repeats less often.",
    },
    mu: {
      control: { type: "range", min: 0.05, max: 0.9, step: 0.01 },
      description: "Depth-of-field fraction. Higher = stronger depth range.",
    },
    seed: {
      control: { type: "number" },
      description: "PRNG seed. Change it to regenerate the dot pattern.",
    },
    showDepth: {
      control: "boolean",
      description: "Render the raw depth map instead of the stereogram.",
    },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const scene = sceneFor(args.sceneId);
    const palette = args.palette ?? scene.palette;

    const handleDownload = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "magic-eye.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }, []);

    return (
      <div style={{ display: "grid", gap: 12, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong>{scene.title}</strong>
          <span style={{ color: "#59636e", fontSize: 13 }}>{scene.hint}</span>
          <button type="button" style={btnStyle} onClick={handleDownload}>
            Download PNG
          </button>
        </div>
        <MagicEyeCanvas
          ref={canvasRef}
          width={args.width}
          height={args.height}
          depth={scene.depth}
          palette={palette}
          eyeSeparation={args.eyeSeparation}
          mu={args.mu}
          seed={args.seed}
          showDepth={args.showDepth}
          style={{ border: "1px solid #d0d7de", maxWidth: "100%", height: "auto" }}
        />
      </div>
    );
  },
};

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  border: "1px solid #d0d7de",
  borderRadius: 8,
  padding: 12,
  background: "#fff",
};

function MagicEyeCard({ scene }: { scene: SceneDef }) {
  const [showDepth, setShowDepth] = useState(false);
  const [seed, setSeed] = useState(1337);

  return (
    <div style={cardStyle}>
      <div style={{ position: "relative", lineHeight: 0 }}>
        <MagicEyeCanvas
          width={560}
          height={380}
          depth={scene.depth}
          palette={scene.palette}
          seed={seed}
          showDepth={showDepth}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 6, border: "1px solid #e1e4e8", background: "#000" }}
          aria-label={`Autostereogram: ${scene.title}. ${scene.hint}`}
        />
        {showDepth && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            depth map
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1f2328", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "system-ui, sans-serif" }}>
            {scene.title}
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: "#59636e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "system-ui, sans-serif" }}>
            {scene.hint}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            style={{ ...btnStyle, padding: "4px 10px", fontSize: 12, background: showDepth ? "#1f2328" : "#f6f8fa", color: showDepth ? "#fff" : "#1f2328" }}
            onClick={() => setShowDepth((v) => !v)}
          >
            {showDepth ? "Hide depth" : "Reveal"}
          </button>
          <button
            type="button"
            style={{ ...btnStyle, padding: "4px 10px", fontSize: 12, opacity: showDepth ? 0.5 : 1, cursor: showDepth ? "default" : "pointer" }}
            onClick={() => setSeed((s) => s + 1)}
            disabled={showDepth}
            title="Regenerate the dot pattern"
          >
            Shuffle
          </button>
        </div>
      </div>
    </div>
  );
}

export const Gallery: Story = {
  name: "The Magic Eye Gallery",
  parameters: { controls: { hideNoControlsWarning: true } },
  argTypes: {
    sceneId: { table: { disable: true } },
    palette: { table: { disable: true } },
    width: { table: { disable: true } },
    height: { table: { disable: true } },
    eyeSeparation: { table: { disable: true } },
    mu: { table: { disable: true } },
    seed: { table: { disable: true } },
    showDepth: { table: { disable: true } },
  },
  render: () => (
    <div style={{ display: "grid", gap: 24, fontFamily: "system-ui, sans-serif", maxWidth: 1100 }}>
      <div>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#59636e", fontFamily: "system-ui, sans-serif" }}>
          Single Image Random Dot Stereograms
        </p>
        <h2 style={{ margin: "6px 0 8px", fontSize: 26, fontWeight: 700, color: "#1f2328", fontFamily: "system-ui, sans-serif" }}>
          The Magic Eye Gallery
        </h2>
        <p style={{ margin: 0, maxWidth: 640, fontSize: 13, lineHeight: 1.6, color: "#59636e", fontFamily: "system-ui, sans-serif" }}>
          Every image below is generated live in your browser from mathematical depth maps and a
          procedurally generated dot pattern — no image assets needed. Relax your eyes and let them
          drift <em>past</em> the screen until the two patterns fuse. A hidden 3D shape will float
          into view.
        </p>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "8px 32px", fontSize: 12, color: "#59636e", fontFamily: "system-ui, sans-serif" }}>
        <li>01 · Stare through the image, not at it</li>
        <li>02 · Let the repeating pattern double, then overlap</li>
        <li>03 · Hold the focus — depth emerges</li>
        <li>04 · Stuck? Tap “Reveal” to see the depth map</li>
      </ol>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px 24px" }}>
        {SCENES.map((scene) => (
          <MagicEyeCard key={scene.id} scene={scene} />
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 11, color: "#59636e", fontFamily: "system-ui, sans-serif" }}>
        Rendered client-side with Thimbleby&apos;s SIRDS separation formula{" "}
        <code>s = (1 − μz)·E / (2 − μz)</code> and a hidden-surface visibility check per scanline.
      </p>
    </div>
  ),
};
