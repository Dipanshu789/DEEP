// (imports remain unchanged)
import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { getEAR, detectBlink } from "@/lib/blinkDetection";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FaceCaptureModalProps {
  userData: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
  };
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function FaceCaptureModal({ userData, userId, onComplete, onCancel }: FaceCaptureModalProps) {
  const [progress, setProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureComplete, setCaptureComplete] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  const [modelLoadingProgress, setModelLoadingProgress] = useState<string>("");
  // const [blinkCount, setBlinkCount] = useState(0); // No longer used
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Blink detection removed
  const { toast } = useToast();

  const saveFaceDataMutation = useMutation({
    mutationFn: async ({ faceImage, faceDescriptor }: { faceImage: string; faceDescriptor: number[] }) => {
      return apiRequest("POST", "/api/user/face-data", {
        userId,
        faceData: faceImage,
        faceDescriptor,
        role: userData.role,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Face registration completed successfully!",
      });
      onComplete();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save face data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load face-api.js models once
  useEffect(() => {
    async function loadModels() {
      setModelLoadingError(null);
      setModelLoadingProgress("Loading tinyFaceDetector model...");
      try {
        console.log("Loading tinyFaceDetector model...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelLoadingProgress("Loading faceLandmark68Net model...");
        console.log("tinyFaceDetector model loaded");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setModelLoadingProgress("Loading faceExpressionNet model...");
        console.log("faceLandmark68Net model loaded");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        setModelLoadingProgress("Loading faceRecognitionNet model...");
        console.log("faceExpressionNet model loaded");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setModelsLoaded(true);
        setModelLoadingProgress("");
        console.log("All face-api.js models loaded");
      } catch (e) {
        setModelLoadingError("Failed to load face detection models. Please check your network and model files.");
        setModelLoadingProgress("");
        setModelsLoaded(false);
        console.error("Model loading error:", e);
      }
    }
    loadModels();
  }, []);

  // Start camera and face detection
  // EAR and blink detection now imported from blinkDetection.ts

  // Improved camera open logic with logging and error handling
  // Add more logging for debugging camera open issues
  useEffect(() => {
    let stream: MediaStream | null = null;
    console.log('Camera effect:', { isCapturing, modelsLoaded, video: !!videoRef.current });
    if (isCapturing && videoRef.current && modelsLoaded) {
      console.log('Attempting to open camera...');
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setCameraError("");
          console.log('Camera stream started');
        })
        .catch((err) => {
          setCameraError('Unable to access camera. Please allow camera access.');
          console.error('Camera error:', err);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturing, modelsLoaded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCapturing && videoRef.current && modelsLoaded) {
      interval = setInterval(async () => {
        if (videoRef.current) {
          const result = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
          setFaceDetected(!!result);
        }
      }, 300);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isCapturing, modelsLoaded]);

  const startFaceCapture = () => {
    setIsCapturing(true);
    setProgress(0);
    setCameraError("");
    setFaceImage(null);
    setCaptureComplete(false);
    setFaceDetected(false);
  };

  const handleTakePhoto = async () => {
    if (!faceDetected) return;
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setFaceImage(dataUrl);
        // Extract face descriptor
        const detection = await faceapi.detectSingleFace(canvasRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (detection && detection.descriptor) {
          setFaceDescriptor(Array.from(detection.descriptor));
        } else {
          setFaceDescriptor(null);
        }
        setCaptureComplete(true);
        setIsCapturing(false);
        setProgress(100);
        // Stop camera
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    }
  };
  // Progress bar logic: update as user advances
  useEffect(() => {
    if (captureComplete) {
      setProgress(100);
    } else if (faceDetected) {
      setProgress(70);
    } else {
      setProgress(0);
    }
  }, [faceDetected, captureComplete]);

  const handleCaptureComplete = () => {
    if (faceImage && faceDescriptor) {
      saveFaceDataMutation.mutate({ faceImage, faceDescriptor });
    } else {
      toast({
        title: "Face Required",
        description: "Please ensure your face is detected and a photo is taken before completing registration.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Camera className="mx-auto text-4xl text-primary mb-4 h-12 w-12" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Face Registration</h2>
            <p className="text-gray-600">Look straight at the camera and blink twice when prompted</p>
          </div>

          {/* Real Camera View */}
          {/* Responsive camera container and image/video sizing */}
          <div className="relative bg-gray-900 rounded-lg mb-6 w-full max-w-[400px] mx-auto aspect-[4/3] flex items-center justify-center overflow-hidden">
            {cameraError && (
              <div className="text-red-500 text-center w-full">{cameraError}</div>
            )}
            {!faceImage && isCapturing && !cameraError && (
              <video
                ref={videoRef}
                width={320}
                height={240}
                className="rounded-lg object-contain w-full h-full bg-black"
                style={{ background: '#222' }}
                playsInline
                muted
              />
            )}
            {/* Face/liveness status */}
            {isCapturing && !cameraError && (
              <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
                <span className={`text-sm font-medium ${faceDetected ? "text-green-400" : "text-red-400"}`}>{faceDetected ? "Face detected" : "No face detected"}</span>
              </div>
            )}
            {/* Show captured image */}
            {faceImage && (
              <img src={faceImage} alt="Face" className="rounded-lg object-contain w-full h-full bg-black" />
            )}
            {/* Canvas for capture (hidden) */}
            <canvas ref={canvasRef} width={320} height={240} style={{ display: "none" }} />
            {/* Overlay */}
            {isCapturing && !cameraError && (
              <div className="absolute inset-4 border-2 border-green-400 rounded-lg opacity-75 pointer-events-none"></div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Face Registration Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Responsive button group */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {modelLoadingError && (
              <div className="text-red-500 text-center w-full mb-2">{modelLoadingError}</div>
            )}
            {!modelsLoaded && !modelLoadingError && (
              <div className="text-center w-full mb-2 text-gray-500">{modelLoadingProgress || 'Loading face detection models...'}</div>
            )}
            <Button
              variant="outline"
              onClick={startFaceCapture}
              disabled={isCapturing || captureComplete || !modelsLoaded}
              className="flex-1"
            >
              {isCapturing ? "Camera On" : (modelsLoaded ? "Start Camera" : "Loading Models...")}
            </Button>
            <Button
              onClick={handleTakePhoto}
              disabled={!isCapturing || !!cameraError || !faceDetected}
              className="flex-1 btn-secondary"
            >
              {faceDetected ? "Take Photo" : "Face required"}
            </Button>
            <Button
              onClick={handleCaptureComplete}
              disabled={!captureComplete || saveFaceDataMutation.isPending}
              className="flex-1 btn-secondary"
            >
              {saveFaceDataMutation.isPending ? "Saving..." : "Complete Registration"}
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <Button variant="ghost" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
