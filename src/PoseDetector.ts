import * as tasksVision from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

// Workaround for Vite/ESM export issue with MediaPipe
const vision = tasksVision as any;
const FilesetResolver = vision.FilesetResolver || vision.default?.FilesetResolver;
const PoseLandmarker = vision.PoseLandmarker || vision.default?.PoseLandmarker;

let poseLandmarker: any = null;
let isInitializing = false;

export async function initPoseLandmarker() {
  if (poseLandmarker || isInitializing) return;
  isInitializing = true;
  try {
    const visionFileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(visionFileset, {
      baseOptions: {
        modelAssetPath: '/pose_landmarker_full.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    console.log('PoseLandmarker initialized.');
  } catch (e) {
    console.error('Failed to init PoseLandmarker', e);
  } finally {
    isInitializing = false;
  }
}

export function detectPose(video: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult | null {
  if (!poseLandmarker) return null;
  return poseLandmarker.detectForVideo(video, timestampMs);
}
