import { forwardRef, useEffect, useMemo, useRef } from "react";
import { blurDepth, classicStereogram, createDefaultPipeline, invertDepth, normalizeDepth, thimblebyStereogram, tiledAutostereogram } from "./pipeline";
import type { MagicEyeCanvasProps, MagicEyeImageSource, MagicEyePipelineContext, MagicEyeStage } from "./types";

function isCanvasLike(source: MagicEyeImageSource): source is HTMLCanvasElement {
  return typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement;
}

function isImageLike(source: MagicEyeImageSource): source is HTMLImageElement {
  return typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement;
}

function isVideoLike(source: MagicEyeImageSource): source is HTMLVideoElement {
  return typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement;
}

function isImageBitmapLike(source: MagicEyeImageSource): source is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap;
}

function isImageDataLike(source: MagicEyeImageSource): source is ImageData {
  return typeof ImageData !== "undefined" && source instanceof ImageData;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawSourceToCanvas(source: Exclude<MagicEyeImageSource, string>, width?: number, height?: number): HTMLCanvasElement {
  if (isCanvasLike(source)) {
    return source;
  }

  const naturalWidth = width ?? (isImageBitmapLike(source) || isImageDataLike(source) ? source.width : isVideoLike(source) ? source.videoWidth : source.naturalWidth);
  const naturalHeight = height ?? (isImageBitmapLike(source) || isImageDataLike(source) ? source.height : isVideoLike(source) ? source.videoHeight : source.naturalHeight);
  const canvas = createCanvas(Math.max(1, naturalWidth || 1), Math.max(1, naturalHeight || 1));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create 2D canvas context.");
  }

  if (isImageDataLike(source)) {
    context.putImageData(source, 0, 0);
    return canvas;
  }

  context.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function loadImageSource(source: MagicEyeImageSource): Promise<HTMLCanvasElement> {
  if (typeof source !== "string") {
    if (isImageLike(source) && !source.complete) {
      await source.decode();
    }
    if (isVideoLike(source) && source.readyState < 2) {
      await new Promise<void>((resolve) => {
        source.addEventListener("loadeddata", () => resolve(), { once: true });
      });
    }
    return drawSourceToCanvas(source);
  }

  if (typeof window === "undefined") {
    throw new Error("String image sources require a browser environment.");
  }

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  await image.decode();
  return drawSourceToCanvas(image);
}

function buildPipelineContext(
  width: number,
  height: number,
  patternCanvas: HTMLCanvasElement,
  depthCanvas: HTMLCanvasElement,
): MagicEyePipelineContext {
  const outputCanvas = createCanvas(width, height);
  const outputCtx = outputCanvas.getContext("2d");
  const patternCtx = patternCanvas.getContext("2d");
  const depthCtx = depthCanvas.getContext("2d");

  if (!outputCtx || !patternCtx || !depthCtx) {
    throw new Error("Unable to create canvas contexts for the MagicEye pipeline.");
  }

  const patternData = patternCtx.getImageData(0, 0, patternCanvas.width, patternCanvas.height);
  const depthData = depthCtx.getImageData(0, 0, depthCanvas.width, depthCanvas.height);

  return {
    width,
    height,
    patternCanvas,
    depthCanvas,
    outputCanvas,
    patternData,
    depthData,
    normalizedDepth: new Float32Array(width * height),
    workingDepth: new Float32Array(width * height),
    outputImageData: outputCtx.createImageData(width, height),
  };
}

function runPipeline(context: MagicEyePipelineContext, stages: MagicEyeStage[]): HTMLCanvasElement {
  for (const stage of stages) {
    stage.run(context);
  }

  return context.outputCanvas;
}

function buildPipeline({
  pipeline,
  eyeSeparation,
  depthStrength,
  blurRadius,
  invertDepth: invert,
  patternRepeatWidth,
  subpixel,
  algorithm,
  occlude,
  occlusionMode,
}: MagicEyeCanvasProps): MagicEyeStage[] {
  if (pipeline) {
    return pipeline;
  }

  const hasCreatorControls = eyeSeparation != null || depthStrength != null || blurRadius != null || invert != null || patternRepeatWidth != null || subpixel != null || algorithm != null || occlude != null || occlusionMode != null;
  if (!hasCreatorControls) {
    return createDefaultPipeline();
  }

  const algo = algorithm ?? "phase";
  const sharedOpts = {
    eyeSeparation: eyeSeparation ?? 96,
    depthStrength: depthStrength ?? 0.75,
    patternRepeatWidth: patternRepeatWidth ?? undefined,
    subpixel: subpixel ?? false,
  };

  const renderStage = algo === "classic"
    ? classicStereogram(sharedOpts)
    : algo === "thimbleby"
    ? thimblebyStereogram({ ...sharedOpts, occlude: occlude ?? true, occlusionMode: occlusionMode ?? "range-overlap" })
    : tiledAutostereogram(sharedOpts);

  return [
    normalizeDepth(),
    blurDepth({ radius: blurRadius ?? 2 }),
    invertDepth(invert ?? false),
    renderStage,
  ];
}

export const MagicEyeCanvas = forwardRef<HTMLCanvasElement, MagicEyeCanvasProps>(function MagicEyeCanvas(
  { pattern, depth, width, height, pipeline, onRendered, style, eyeSeparation, depthStrength, blurRadius, invertDepth: invert, patternRepeatWidth, subpixel, algorithm, occlude, occlusionMode, ...canvasProps },
  ref,
) {
  const innerRef = useRef<HTMLCanvasElement | null>(null);
  const stages = useMemo(
    () => buildPipeline({ pipeline, eyeSeparation, depthStrength, blurRadius, invertDepth: invert, patternRepeatWidth, subpixel, algorithm, occlude, occlusionMode } as MagicEyeCanvasProps),
    [pipeline, eyeSeparation, depthStrength, blurRadius, invert, patternRepeatWidth, subpixel, algorithm, occlude, occlusionMode],
  );

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const [patternCanvas, depthCanvas] = await Promise.all([
        loadImageSource(pattern),
        loadImageSource(depth),
      ]);

      if (cancelled) {
        return;
      }

      const context = buildPipelineContext(width, height, patternCanvas, depthCanvas);
      const outputCanvas = runPipeline(context, stages);
      const target = innerRef.current;
      if (target) {
        target.width = width;
        target.height = height;
        const targetCtx = target.getContext("2d");
        if (targetCtx) {
          targetCtx.clearRect(0, 0, width, height);
          targetCtx.drawImage(outputCanvas, 0, 0);
        }
      }
      onRendered?.(outputCanvas);
    }

    void render().catch((error) => {
      console.error("react-magiceye render failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, [depth, height, onRendered, pattern, stages, width]);

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
});
