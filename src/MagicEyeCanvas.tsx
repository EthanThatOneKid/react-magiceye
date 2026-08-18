import { forwardRef, useEffect, useRef } from "react";
import type { CanvasHTMLAttributes } from "react";
import { renderDepthMap, renderStereogram } from "./procedural";
import type { DepthFn, ScenePalette } from "./procedural";

export interface MagicEyeCanvasProps
  extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "width" | "height"> {
  width: number;
  height: number;
  /** Depth function: 0 = far / background, 1 = near / closest to the viewer. */
  depth: DepthFn;
  /** Pattern flavor. Defaults to high-contrast random dots. */
  palette?: ScenePalette;
  /** Eye separation in pixels; larger = pattern repeats less often. */
  eyeSeparation?: number;
  /** Fraction of eye separation mapped to the depth range (depth of field). */
  mu?: number;
  /** PRNG seed; bump it to regenerate the pattern. */
  seed?: number;
  /** Render the raw depth map instead of the stereogram. */
  showDepth?: boolean;
  /** Called with the rendered canvas after each draw. */
  onRendered?: (canvas: HTMLCanvasElement) => void;
}

export const MagicEyeCanvas = forwardRef<HTMLCanvasElement, MagicEyeCanvasProps>(
  function MagicEyeCanvas(
    {
      width,
      height,
      depth,
      palette = "dots",
      eyeSeparation,
      mu,
      seed = 1337,
      showDepth = false,
      onRendered,
      style,
      ...canvasProps
    },
    ref,
  ) {
    const innerRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = innerRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = showDepth
        ? renderDepthMap(depth, width, height)
        : renderStereogram({ width, height, depth, palette, eyeSeparation, mu, seed });
      ctx.putImageData(img, 0, 0);
      onRendered?.(canvas);
    }, [width, height, depth, palette, eyeSeparation, mu, seed, showDepth, onRendered]);

    return (
      <canvas
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        width={width}
        height={height}
        style={style}
        {...canvasProps}
      />
    );
  },
);
