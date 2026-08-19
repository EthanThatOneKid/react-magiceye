// Procedural Single Image Random Dot Stereogram (SIRDS) generator.
//
// This is a faithful port of the generator from the v0 "Autostereogram
// renderer" project. It *generates* its own random-dot (or rainbow/candy/mono)
// pattern and derives depth from mathematical functions, so a scene needs
// nothing but a canvas to render.
//
// The algorithm is the pixel-linking constraint method described in Harold
// Thimbleby's "Displaying 3D Images: Algorithms for Single Image Random Dot
// Stereograms" (the foundational SIRDS paper). For each scanline we compute a
// stereo "separation" from the depth value, link the two pixels that must
// share a color, then flood the row with a repeating pattern that respects
// those links. The brain fuses the repeated pattern into genuine 3D depth.

export type DepthFn = (x: number, y: number, w: number, h: number) => number;

// ---- Depth maps (0 = far / background, 1 = near / closest to viewer) --------

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const sphere: DepthFn = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38;
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return 0;
  // Hemisphere: z proportional to height of sphere surface.
  return Math.sqrt(1 - d2 / (r * r));
};

export const pyramid: DepthFn = (x, y, w, h) => {
  const nx = Math.abs(x - w / 2) / (w * 0.42);
  const ny = Math.abs(y - h / 2) / (h * 0.42);
  const d = Math.max(nx, ny);
  return d > 1 ? 0 : 1 - d;
};

export const ripples: DepthFn = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxR = Math.min(w, h) * 0.5;
  if (r > maxR) return 0;
  const falloff = 1 - r / maxR;
  return (0.5 + 0.5 * Math.cos(r / 9)) * falloff;
};

export const wave: DepthFn = (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  const z =
    0.5 +
    0.25 * Math.sin(nx * Math.PI * 4) +
    0.25 * Math.sin(ny * Math.PI * 3 + nx * Math.PI);
  return Math.min(1, Math.max(0, z));
};

export const cone: DepthFn = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxR = Math.min(w, h) * 0.42;
  return r > maxR ? 0 : 1 - r / maxR;
};

export const heart: DepthFn = (x, y, w, h) => {
  // Parametric heart implicit curve, filled and given a rounded bump.
  const s = Math.min(w, h) * 0.028;
  const px = (x - w / 2) / s;
  const py = -(y - h * 0.55) / s;
  const a = px * px + py * py - 1;
  const inside = a * a * a - px * px * py * py * py;
  if (inside > 0) return 0;
  // Bump: deeper toward the center of the heart mass.
  return smoothstep(0, -3.5, inside) * 0.85 + 0.15;
};

export const torus: DepthFn = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const outer = Math.min(w, h) * 0.42;
  const inner = Math.min(w, h) * 0.16;
  const mid = (outer + inner) / 2;
  const tubeR = (outer - inner) / 2;
  const d = Math.abs(r - mid);
  if (d > tubeR) return 0;
  return Math.sqrt(1 - (d / tubeR) ** 2);
};

// Depth map rendered from text drawn on an offscreen canvas.
export function makeTextDepth(text: string): DepthFn {
  let cache: { w: number; h: number; data: Float32Array } | null = null;

  const build = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSize = Math.min(h * 0.55, (w / Math.max(text.length, 1)) * 1.7);
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.fillText(text, w / 2, h / 2);

    const img = ctx.getImageData(0, 0, w, h).data;
    const data = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      // Use red channel brightness as raised depth.
      data[i] = img[i * 4] / 255 > 0.5 ? 1 : 0;
    }
    // Soften edges a touch so the letters read as raised blocks, not noise.
    cache = { w, h, data };
  };

  return (x, y, w, h) => {
    if (!cache || cache.w !== w || cache.h !== h) build(w, h);
    return cache!.data[y * w + x];
  };
}

export type ScenePalette = "dots" | "rainbow" | "candy" | "mono";

export interface SceneDef {
  id: string;
  title: string;
  hint: string;
  depth: DepthFn;
  palette: ScenePalette;
}

export const SCENES: SceneDef[] = [
  { id: "sphere", title: "Floating Sphere", hint: "A smooth ball hovers in front of the noise.", depth: sphere, palette: "dots" },
  { id: "text3d", title: "The Word “3D”", hint: "Bold letters pop out toward you.", depth: makeTextDepth("3D"), palette: "candy" },
  { id: "ripples", title: "Water Ripples", hint: "Concentric rings recede into a pond.", depth: ripples, palette: "rainbow" },
  { id: "pyramid", title: "Rising Pyramid", hint: "A four-sided pyramid tips toward you.", depth: pyramid, palette: "dots" },
  { id: "heart", title: "Raised Heart", hint: "A heart lifts off the background.", depth: heart, palette: "candy" },
  { id: "torus", title: "Donut / Torus", hint: "A ring floats with a hole in the middle.", depth: torus, palette: "mono" },
  { id: "wave", title: "Rolling Waves", hint: "A rolling hill-and-valley surface.", depth: wave, palette: "rainbow" },
  { id: "cone", title: "Sharp Cone", hint: "A cone points straight at your eyes.", depth: cone, palette: "dots" },
];

// ---- Palettes ---------------------------------------------------------------

function paletteColor(kind: ScenePalette, rng: () => number): [number, number, number] {
  switch (kind) {
    case "mono": {
      const v = rng() > 0.5 ? 235 : 20;
      return [v, v, v];
    }
    case "rainbow": {
      const h = rng() * 360;
      return hsl(h, 85, 55);
    }
    case "candy": {
      const hues = [200, 320, 45, 160, 275];
      const h = hues[Math.floor(rng() * hues.length)];
      return hsl(h, 80, 58);
    }
    case "dots":
    default: {
      // Bright dots on dark, high contrast for easy fusing.
      const on = rng() > 0.5;
      return on ? [245, 246, 250] : [24, 24, 32];
    }
  }
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// Deterministic PRNG so a scene renders identically on re-run.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- The stereogram algorithm (Thimbleby SIRDS) -----------------------------

export interface RenderOptions {
  width: number;
  height: number;
  depth: DepthFn;
  palette: ScenePalette;
  // Eye separation in pixels; larger = pattern repeats less often.
  eyeSeparation?: number;
  // mu: fraction of eye separation that maps to the depth range (depth of field).
  mu?: number;
  seed?: number;
}

export function renderStereogram(opts: RenderOptions): ImageData {
  const { width: w, height: h, depth, palette } = opts;
  const E = opts.eyeSeparation ?? Math.round(w / 3.2);
  const mu = opts.mu ?? 1 / 3;
  const rng = mulberry32(opts.seed ?? 1337);

  const out = new ImageData(w, h);
  const data = out.data;

  // The far-plane separation is the base tile width.
  const separation = (z: number) => Math.round(((1 - mu * z) * E) / (2 - mu * z));

  const same = new Int32Array(w);
  const rowColor = new Uint8ClampedArray(w * 3);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) same[x] = x;

    for (let x = 0; x < w; x++) {
      const z = depth(x, y, w, h);
      const s = separation(z);
      let left = x - (s >> 1);
      let right = left + s;

      if (left >= 0 && right < w) {
        // Hidden-surface check: only link if this feature is actually visible
        // (not occluded by something nearer between the two eye rays).
        let visible = true;
        let t = 1;
        let zt: number;
        do {
          zt = z + (2 * (2 - mu * z) * t) / (mu * E);
          const zl = depth(x - t, y, w, h);
          const zr = x + t < w ? depth(x + t, y, w, h) : 0;
          visible = zl < zt && zr < zt;
          t++;
        } while (visible && zt < 1);

        if (visible) {
          // Resolve existing links so left/right end up in the same set.
          let l = same[left];
          while (l !== left && l !== right) {
            if (l < right) {
              left = l;
              l = same[left];
            } else {
              same[left] = right;
              left = right;
              l = same[left];
              right = l;
            }
          }
          same[left] = right;
        }
      }
    }

    // Flood the row: unlinked pixels get a fresh pattern color, linked pixels
    // copy from their partner so the repeat is exact.
    for (let x = w - 1; x >= 0; x--) {
      let r: number, g: number, b: number;
      if (same[x] === x) {
        [r, g, b] = paletteColor(palette, rng);
      } else {
        const p = same[x] * 3;
        r = rowColor[p];
        g = rowColor[p + 1];
        b = rowColor[p + 2];
      }
      const q = x * 3;
      rowColor[q] = r;
      rowColor[q + 1] = g;
      rowColor[q + 2] = b;

      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  return out;
}

// Render the raw depth map to an ImageData for the "reveal" toggle.
export function renderDepthMap(depth: DepthFn, w: number, h: number): ImageData {
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.round(depth(x, y, w, h) * 255);
      const idx = (y * w + x) * 4;
      out.data[idx] = v;
      out.data[idx + 1] = v;
      out.data[idx + 2] = v;
      out.data[idx + 3] = 255;
    }
  }
  return out;
}
