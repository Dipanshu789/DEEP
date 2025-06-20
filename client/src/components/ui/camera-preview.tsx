import { useEffect } from "react";
import { Camera } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";

interface CameraPreviewProps {
  className?: string;
}

export default function CameraPreview({ className = "" }: CameraPreviewProps) {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera({
    facingMode: "user",
    width: 640,
    height: 480,
  });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  if (error) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center ${className}`}>
        <Camera className="text-4xl text-gray-500 mb-2" size={32} />
        <p className="text-xs text-gray-600 text-center px-4">{error}</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${className}`}>
        <Camera className="text-4xl text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
