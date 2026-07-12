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
}

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
}
