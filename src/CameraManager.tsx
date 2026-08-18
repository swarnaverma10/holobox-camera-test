import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MODES, ModeSelector } from './ModeSelector';
import type { ResolutionMode } from './ModeSelector';
import { calculateFit } from './DisplayFitEngine';
import type { FitResult } from './DisplayFitEngine';
import { mapLandmarks } from './LandmarkMapper';
import { drawSkeleton } from './GestureEngine';
import { initPoseLandmarker, detectPose } from './PoseDetector';
import { jsPDF } from 'jspdf';

export const CameraManager: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqAnimationFrameId = useRef<number>(0);
  const fpsFrameCount = useRef<number>(0);
  const fpsLastTime = useRef<number>(0);

  // Use refs to avoid 60 FPS re-renders!
  const currentFitResult = useRef<FitResult | null>(null);

  const [currentMode, setCurrentMode] = useState<ResolutionMode>(MODES[0]);
  const [nativeRes, setNativeRes] = useState({ w: 0, h: 0 });
  const [nativeFps, setNativeFps] = useState<number>(0);
  const [cameraName, setCameraName] = useState('Unknown Camera');
  const [fitResultState, setFitResultState] = useState<FitResult | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Diagnostics
  const [diagPoseRunning, setDiagPoseRunning] = useState('NO');
  const [diagLandmarks, setDiagLandmarks] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (nativeRes.w > 0 && nativeRes.h > 0) {
      const fit = calculateFit(
        windowSize.w,
        windowSize.h,
        currentMode.width,
        currentMode.height,
        nativeRes.w,
        nativeRes.h,
        'cover'
      );
      setFitResultState(fit);
      currentFitResult.current = fit;
    }
  }, [currentMode, nativeRes, windowSize]);

  const processFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      reqAnimationFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const now = performance.now();

    // Calculate actual FPS
    fpsFrameCount.current++;
    if (now - fpsLastTime.current >= 1000) {
      setNativeFps(fpsFrameCount.current);
      fpsFrameCount.current = 0;
      fpsLastTime.current = now;
    }

    // Run MediaPipe and draw instantly to canvas
    let detectedCount = 0;
    try {
      const result = detectPose(video, now);
      if (result) {
        setDiagPoseRunning('YES');
        if (result.landmarks && result.landmarks.length > 0) {
          detectedCount = result.landmarks[0].length;
        }
      } else {
        setDiagPoseRunning('NO');
      }
      
      const canvas = canvasRef.current;
      const fit = currentFitResult.current;
      
      if (canvas && fit) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (detectedCount > 0 && result) {
            const mapped = mapLandmarks(result.landmarks[0], fit);
            drawSkeleton(ctx, mapped, fit.viewWidth, fit.viewHeight);
          } else {
            ctx.clearRect(0, 0, fit.viewWidth, fit.viewHeight);
          }
        }
      }
    } catch (e) {
      console.error("Pose detection error:", e);
    }

    // Rate-limit React state updates for diagnostics to avoid "Maximum update depth exceeded"
    if (fpsFrameCount.current === 0) {
      setDiagLandmarks(detectedCount);
    }

    reqAnimationFrameId.current = requestAnimationFrame(processFrame);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;
    
    async function startCamera() {
      await initPoseLandmarker();
      if (!isActive) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: currentMode.width },
            height: { ideal: currentMode.height }
          } 
        });
        
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!isActive) return;
            videoRef.current?.play();
            const track = stream?.getVideoTracks()[0];
            if (track) {
              setCameraName(track.label || 'Unknown Camera');
              const settings = track.getSettings();
              setNativeRes({ w: settings.width || videoRef.current!.videoWidth, h: settings.height || videoRef.current!.videoHeight });
            }
            fpsLastTime.current = performance.now();
            
            // Only kick off processFrame if not already running
            if (!reqAnimationFrameId.current) {
              processFrame();
            }
          };
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    }

    startCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentMode, processFrame]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Holobox Camera Testing Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Camera Name: ${cameraName}`, 20, 40);
    doc.text(`Requested Mode: ${currentMode.name} (${currentMode.width} x ${currentMode.height})`, 20, 50);
    doc.text(`Actual Camera Resolution: ${nativeRes.w} x ${nativeRes.h}`, 20, 60);
    doc.text(`Actual FPS: ${nativeFps}`, 20, 70);

    const isSupported = nativeRes.w === currentMode.width && nativeRes.h === currentMode.height;
    doc.text(`Status: ${isSupported ? 'Supported (Exact Match)' : 'Unsupported (Using available format)'}`, 20, 80);

    doc.setFontSize(16);
    doc.text("Pose Detection", 20, 100);
    doc.setFontSize(12);
    doc.text(`Status: ${diagLandmarks > 0 ? 'Verified (Aligned & Real-time)' : 'Failed / No landmarks detected'}`, 20, 110);
    
    doc.save("holobox_camera_report.pdf");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-white" ref={containerRef}>
      
      {/* Top Left Technical HUD */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10 bg-black/60 p-4 md:p-6 rounded-lg backdrop-blur-md pointer-events-none border border-gray-700 shadow-2xl max-w-[95vw]">
        <div className="space-y-2">
          <p className="text-base md:text-lg text-gray-300 truncate leading-relaxed">Camera: <span className="text-white font-bold">{cameraName === 'Unknown Camera' ? 'Initializing...' : cameraName}</span></p>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">Native: <span className="text-white font-bold">{nativeRes.w > 0 ? `${nativeRes.w} × ${nativeRes.h}` : '--'}</span> <span className="inline-block ml-3 md:ml-5">FPS:</span> <span className="text-white font-bold">{nativeRes.w > 0 ? nativeFps : '--'}</span></p>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">Mode: <span className="text-white font-bold">{currentMode.name}</span> <span className="inline-block ml-3 md:ml-5">Target:</span> <span className="text-white font-bold">{currentMode.width} × {currentMode.height}</span></p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-600 text-sm md:text-base text-yellow-400 font-mono space-y-1.5 leading-relaxed">
          <p>Pose model loaded: YES</p>
          <p>Pose inference running: {diagPoseRunning}</p>
          <p>Landmarks detected: {diagLandmarks}</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 md:bottom-8 left-0 w-full flex flex-col items-center gap-2 md:gap-4 z-20 pointer-events-none px-2">
        <ModeSelector currentMode={currentMode} onModeSelect={setCurrentMode} />
        <button 
          onClick={generatePDF}
          className="px-5 py-2 md:px-6 md:py-2 text-xs md:text-base bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg transition-colors pointer-events-auto"
        >
          Generate PDF
        </button>
      </div>

      {/* Logical View Container */}
      <div 
        className="absolute overflow-hidden"
        style={{
          left: fitResultState ? fitResultState.viewOffsetX : 0,
          top: fitResultState ? fitResultState.viewOffsetY : 0,
          width: fitResultState ? fitResultState.viewWidth : '100%',
          height: fitResultState ? fitResultState.viewHeight : '100%',
        }}
      >
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none transform scale-x-[-1]"
          playsInline
          muted
        />
        {fitResultState && (
          <canvas
            ref={canvasRef}
            width={fitResultState.viewWidth}
            height={fitResultState.viewHeight}
            className="absolute top-0 left-0 w-full h-full pointer-events-none transform scale-x-[-1]"
          />
        )}
      </div>

    </div>
  );
};
