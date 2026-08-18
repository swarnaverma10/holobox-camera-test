export type FitMode = 'letterbox' | 'cover';

export interface FitResult {
  // How the logical resolution (e.g., 1080x1920) fits into the window
  viewScale: number;
  viewOffsetX: number;
  viewOffsetY: number;
  viewWidth: number;
  viewHeight: number;

  // How the native video frame fits into the logical target view
  cameraScale: number;
  cameraOffsetX: number;
  cameraOffsetY: number;
  cameraDrawWidth: number;
  cameraDrawHeight: number;

  targetWidth: number;
  targetHeight: number;
  nativeWidth: number;
  nativeHeight: number;
}

export function calculateFit(
  screenWidth: number,
  screenHeight: number,
  targetWidth: number,
  targetHeight: number,
  nativeWidth: number,
  nativeHeight: number,
  fitMode: FitMode = 'letterbox'
): FitResult {
  if (targetWidth === 0 || targetHeight === 0 || nativeWidth === 0 || nativeHeight === 0) {
    return {
      viewScale: 1, viewOffsetX: 0, viewOffsetY: 0, viewWidth: screenWidth, viewHeight: screenHeight,
      cameraScale: 1, cameraOffsetX: 0, cameraOffsetY: 0, cameraDrawWidth: screenWidth, cameraDrawHeight: screenHeight,
      targetWidth, targetHeight, nativeWidth, nativeHeight
    };
  }

  // 1. Fit logical target resolution into the browser window
  const viewScaleX = screenWidth / targetWidth;
  const viewScaleY = screenHeight / targetHeight;
  const viewScale = fitMode === 'letterbox' ? Math.min(viewScaleX, viewScaleY) : Math.max(viewScaleX, viewScaleY);
  const viewWidth = targetWidth * viewScale;
  const viewHeight = targetHeight * viewScale;
  const viewOffsetX = (screenWidth - viewWidth) / 2;
  const viewOffsetY = (screenHeight - viewHeight) / 2;

  // 2. Fit native video stream into the logical target resolution
  const camScaleX = targetWidth / nativeWidth;
  const camScaleY = targetHeight / nativeHeight;
  const cameraScale = fitMode === 'letterbox' ? Math.min(camScaleX, camScaleY) : Math.max(camScaleX, camScaleY);
  const cameraDrawWidth = nativeWidth * cameraScale;
  const cameraDrawHeight = nativeHeight * cameraScale;
  const cameraOffsetX = (targetWidth - cameraDrawWidth) / 2;
  const cameraOffsetY = (targetHeight - cameraDrawHeight) / 2;

  return {
    viewScale, viewOffsetX, viewOffsetY, viewWidth, viewHeight,
    cameraScale, cameraOffsetX, cameraOffsetY, cameraDrawWidth, cameraDrawHeight,
    targetWidth, targetHeight, nativeWidth, nativeHeight
  };
}
