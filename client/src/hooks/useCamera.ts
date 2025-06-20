import { useState, useRef, useCallback } from "react";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode || "user",
          width: options.width || 640,
          height: options.height || 480,
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (err) {
      setError("Failed to access camera. Please check permissions.");
      console.error("Camera access error:", err);
    }
  }, [options.facingMode, options.width, options.height]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isActive) return null;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  }, [isActive]);

  return {
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
