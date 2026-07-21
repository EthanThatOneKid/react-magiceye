export type MagicEyeImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap
  | ImageData
  | string;

export interface MagicEyePipelineContext {
  width: number;
  height: number;
  patternCanvas: HTMLCanvasElement;
  depthCanvas: HTMLCanvasElement;
  outputCanvas: HTMLCanvasElement;
  patternData: ImageData;
  depthData: ImageData;
  normalizedDepth: Float32Array;
  workingDepth: Float32Array;
  outputImageData: ImageData;
  cache?: {
    normalizedDepth?: Float32Array;
    workingDepth?: Float32Array;
    outputImageData?: ImageData;
    lookL?: Int32Array;
    lookR?: Int32Array;
    blurHorizontal?: Float32Array;
    blurOutput?: Float32Array;
  };
}

export interface MagicEyeStage {
  name: string;
  run(context: MagicEyePipelineContext): void;
}

export interface BlurDepthOptions {
  radius?: number;
}

export interface TiledAutostereogramOptions {
  eyeSeparation?: number;
  depthStrength?: number;
  patternRepeatWidth?: number;
  subpixel?: boolean;
}

export interface ClassicStereogramOptions {
  eyeSeparation?: number;
  depthStrength?: number;
  patternRepeatWidth?: number;
  subpixel?: boolean;
}

export interface ThimblebyStereogramOptions {
  eyeSeparation?: number;
  depthStrength?: number;
  patternRepeatWidth?: number;
  subpixel?: boolean;
  occlude?: boolean;
  occlusionMode?: "range-overlap" | "shortest-link";
}

export type StereogramAlgorithm = "phase" | "classic" | "thimbleby";

export interface MagicEyeCanvasProps
  extends Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, "width" | "height"> {
  pattern: MagicEyeImageSource;
  depth: MagicEyeImageSource;
  width: number;
  height: number;
  pipeline?: MagicEyeStage[];
  onRendered?: (canvas: HTMLCanvasElement) => void;
  eyeSeparation?: number;
  depthStrength?: number;
  blurRadius?: number;
  invertDepth?: boolean;
  patternRepeatWidth?: number;
  subpixel?: boolean;
  algorithm?: StereogramAlgorithm;
  occlude?: boolean;
  occlusionMode?: "range-overlap" | "shortest-link";
}
