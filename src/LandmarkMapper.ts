import type { FitResult } from './DisplayFitEngine';

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

/**
 * Maps normalized landmarks (0.0 - 1.0) to actual on-screen canvas coordinates.
 * The canvas matches the CSS `object-cover` layout of the video exactly.
 */
export function mapLandmarks(
  landmarks: Point3D[],
  fitResult: FitResult
): Point3D[] {
  // The video element is sized to viewWidth x viewHeight.
  // The CSS object-fit: cover scales the native video to cover that area.
  const scale = Math.max(
    fitResult.viewWidth / fitResult.nativeWidth,
    fitResult.viewHeight / fitResult.nativeHeight
  );

  const renderedWidth = fitResult.nativeWidth * scale;
  const renderedHeight = fitResult.nativeHeight * scale;

  const offsetX = (fitResult.viewWidth - renderedWidth) / 2;
  const offsetY = (fitResult.viewHeight - renderedHeight) / 2;

  return landmarks.map(lm => {
    // MediaPipe Web returns normalized coordinates [0..1]
    const nativeX = lm.x * fitResult.nativeWidth;
    const nativeY = lm.y * fitResult.nativeHeight;

    const screenX = nativeX * scale + offsetX;
    const screenY = nativeY * scale + offsetY;

    return {
      x: screenX,
      y: screenY,
      z: lm.z * scale,
      visibility: lm.visibility,
      presence: lm.presence,
    };
  });
}
