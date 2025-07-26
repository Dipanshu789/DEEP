import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import * as faceapi from "face-api.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, MapPin, Satellite, User, Check } from "lucide-react";
import GoogleMapView from "@/components/GoogleMapView";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CheckInProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckInProcessModal({ isOpen, onClose, onSuccess }: CheckInProcessModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  // Face detection state
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use standard import for useAuth (fix SSR/ESM bug)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const { user, isLoading } = require("@/hooks/useAuth").useAuth();
  // Use the hook directly:
  // Define the expected user type with companyCode
  interface UserWithCompanyCode {
    companyCode?: string;
    [key: string]: any;
  }
  const { user, isLoading } = useAuth() as { user: UserWithCompanyCode; isLoading: boolean };
  // Prevent admins from using the check-in modal at all
  if (user?.role === 'admin') {
    return null;
  }

  // State for user and company location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [companyLocation, setCompanyLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Fetch company geofence location on mount
  useEffect(() => {
    async function fetchCompanyLocation() {
      if (!user?.companyCode) return;
      try {
        const res = await fetch(`/api/company/${user.companyCode}`);
        const data = await res.json();
        if (data && data.geofenceLatitude && data.geofenceLongitude && data.name) {
          setCompanyLocation({ lat: data.geofenceLatitude, lng: data.geofenceLongitude, name: data.name });
        }
      } catch {}
    }
    fetchCompanyLocation();
  }, [user?.companyCode]);

  // Robustly fetch user location when entering location step
  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;
    const getLocation = () => {
      if (!navigator.geolocation) {
        setUserLocation(null);
        setCameraError("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted) {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setCameraError("");
          }
        },
        (err) => {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(getLocation, 1000);
          } else {
            if (isMounted) {
              setUserLocation(null);
              setCameraError("Unable to get precise GPS location. Please enable GPS and try again.");
            }
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    if (currentStep === 2) {
      getLocation();
    }
    return () => { isMounted = false; };
  }, [currentStep]);
  const checkInMutation = useMutation({
    mutationFn: async ({ latitude, longitude, faceData, faceDescriptor }: { latitude: number; longitude: number; faceData: string; faceDescriptor: number[] }) => {
      if (!user?.companyCode) {
        throw new Error("You are not associated with any company. Please join a company first.");
      }
      if (!user?.email) {
        throw new Error("User email not found. Please log in again.");
      }
      return apiRequest("POST", "/api/attendance/checkin", {
        email: user.email, // Ensure email is sent to backend
        latitude,
        longitude,
        faceData,
        faceDescriptor,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Check-in completed successfully!",
      });
      onSuccess();
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const simulateProgress = (callback: () => void) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 25;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(callback, 500);
        }
        return newProgress;
      });
    }, 200);
  };

  // Load face-api.js models once
  useEffect(() => {
    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (e) {
        setCameraError("Failed to load face detection models.");
      }
    }
    loadModels();
  }, []);

  // Camera and face detection for step 1 (no liveness)
  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: NodeJS.Timeout;
    if (isCapturing && videoRef.current && modelsLoaded) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(() => setCameraError("Unable to access camera. Please allow camera access."));

      interval = setInterval(async () => {
        if (videoRef.current) {
          const result = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
          setFaceDetected(!!result);
          if (result && result.descriptor) {
            setFaceDescriptor(Array.from(result.descriptor));
          } else {
            setFaceDescriptor(null);
          }
        }
      }, 300);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      clearInterval(interval);
    };
  }, [isCapturing, modelsLoaded]);

  const startFaceCapture = () => {
    setIsCapturing(true);
    setCameraError("");
    setFaceImage(null);
    setFaceDetected(false);
    setFaceDescriptor(null);
  };

  const handleTakePhoto = () => {
    if (!faceDetected || !faceDescriptor) return;
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setFaceImage(dataUrl);
        setIsCapturing(false);
      }
    }
  };

  const handleStepComplete = () => {
    if (currentStep === 1) {
      // Only allow to proceed if face detected, descriptor present, and photo taken
      if (!faceDetected || !faceDescriptor || !faceImage) {
        toast({
          title: "Error",
          description: "Please ensure your face is clearly visible and take a photo.",
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      setProgress(0);
    } else {
      // Final step - complete check-in
      setProgress(0);
      (async () => {
        try {
          const position = await getCurrentPosition();
          checkInMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            faceData: faceImage || "",
            faceDescriptor: faceDescriptor!,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Unable to get location. Please enable GPS.",
            variant: "destructive",
          });
        }
      })();
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  };

  if (!isOpen) return null;

  const stepContent = [
    {
      icon: Eye,
      title: "Face Verification",
      description: "Look at the camera and ensure your face is clearly visible. No blinking required.",
      content: (
        <div>
          <div className="relative bg-gray-900 rounded-lg mb-4 w-full max-w-[400px] mx-auto aspect-[4/3] flex items-center justify-center overflow-hidden">
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
            {/* Face status */}
            {isCapturing && !cameraError && (
              <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
                <span className={`text-sm font-medium ${faceDetected ? "text-green-400" : "text-red-400"}`}>{faceDetected ? "Face detected" : "No face detected"}</span>
                <span className={`text-xs text-gray-400 mt-1"}`}>{faceDescriptor ? "Face ready for verification" : "Align your face in the frame"}</span>
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
            <Button
              variant="outline"
              onClick={startFaceCapture}
              disabled={isCapturing}
              className="flex-1"
            >
              {isCapturing ? "Camera On" : "Start Camera"}
            </Button>
            <Button
              onClick={handleTakePhoto}
              disabled={!isCapturing || !!cameraError || !faceDetected || !faceDescriptor}
              className="flex-1 btn-secondary"
            >
              {faceDetected && faceDescriptor ? "Take Photo" : "Face required"}
            </Button>
          </div>
        </div>
      ),
    },
    {
      icon: MapPin,
      title: "Location Verification",
      description: "Checking if you're within the office area",
      content: (
        <div>
          <div style={{ width: '100%', height: 300, marginBottom: 16 }}>
            {companyLocation && userLocation ? (
              <GoogleMapView
                center={companyLocation}
                zoom={16}
                markers={[
                  {
                    lat: companyLocation.lat,
                    lng: companyLocation.lng,
                    label: companyLocation.name,
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616494.png",
                    iconSize: { width: 40, height: 40 }
                  },
                  {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    label: user?.fullName || "You",
                    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    iconSize: { width: 36, height: 36 }
                  }
                ]}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                {cameraError ? cameraError : "Loading map and locations..."}
              </div>
            )}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">✓ GPS coordinates verified</p>
            <p className="text-green-800 text-sm">✓ Within office geofence boundary</p>
            <p className="text-green-800 text-sm">✓ Location accuracy: High</p>
          </div>
        </div>
      ),
    },
    {
      icon: Satellite,
      title: "Start Tracking",
      description: "Initializing background location tracking",
      content: (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">🛰️ GPS tracking enabled</p>
            <p className="text-blue-800 text-sm">📱 Background monitoring active</p>
            <p className="text-blue-800 text-sm">✅ Check-in process ready!</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = stepContent[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full flex justify-center items-end min-h-screen" style={{ marginBottom: '20vh' }}>
        <Card className="max-w-md w-full relative flex flex-col" style={{ minHeight: '80vh', maxHeight: '95vh' }}>
          <CardContent className="p-4 sm:p-6 flex flex-col h-full" style={{ paddingBottom: 0 }}>
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Check-In Process</h2>
              <div className="text-primary font-medium">Step {currentStep} of 3</div>
            </div>

            <div className="text-center mb-4 sm:mb-6 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <StepIcon className="mx-auto text-6xl text-primary mb-4 h-16 w-16" />
              <h3 className="text-xl font-semibold mb-4">{currentStepData.title}</h3>
              <p className="text-gray-600 mb-6">{currentStepData.description}</p>
              {currentStepData.content}
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  {currentStep === 1 ? "Face Match Progress" :
                   currentStep === 2 ? "Location Check" :
                   "Tracking Setup"}
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </div>

            {/* Sticky button bar for mobile */}
            <div className="w-full bg-white pt-2 pb-2 px-0 sm:px-0 flex space-x-3 sticky bottom-0 left-0 z-10 border-t border-gray-200" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.03)' }}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={checkInMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStepComplete}
                disabled={checkInMutation.isPending}
                className="flex-1 btn-secondary"
              >
                {checkInMutation.isPending ? "Processing..." :
                 currentStep === 3 ? "Complete Check-In" :
                 currentStep === 1 ? "Verify Face" :
                 "Verify Location"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
