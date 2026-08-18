import type { Point3D } from './LandmarkMapper';

const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], // Right Eye
  [0, 4], [4, 5], [5, 6], [6, 8], // Left Eye
  [9, 10], // Mouth
  [11, 12], // Shoulders
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], // Left Arm/Hand
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], // Right Arm/Hand
  [11, 23], [12, 24], [23, 24], // Torso
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], // Left Leg/Foot
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32], // Right Leg/Foot
];

export function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: Point3D[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  // Draw lines
  ctx.strokeStyle = 'lime';
  ctx.lineWidth = 4;
  POSE_CONNECTIONS.forEach(([start, end]) => {
    const pt1 = landmarks[start];
    const pt2 = landmarks[end];

    if (!pt1 || !pt2) return;
    // Some models don't return presence/visibility. If missing, assume visible.
    const vis1 = pt1.visibility ?? 1;
    const vis2 = pt2.visibility ?? 1;
    if (vis1 < 0.5 || vis2 < 0.5) return;

    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.stroke();
  });

  // Draw points
  ctx.fillStyle = 'red';
  landmarks.forEach(pt => {
    const vis = pt.visibility ?? 1;
    if (vis < 0.5) return;
    
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // add small white center for high contrast
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'red';
  });
}
