import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Camera, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, updateCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import CameraPreview from "@/components/ui/camera-preview";

const livenessInstructions = [
  "Look straight at the camera",
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Blink slowly",
  "Smile naturally"
];

export default function FaceRegistrationPage() {
  const [faceProgress, setFaceProgress] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const maxFaceFrames = 5;

  const faceRegistrationMutation = useMutation({
    mutationFn: async (faceData: string) => {
      if (!currentUser?.id) throw new Error("User not found");
      const response = await apiRequest("POST", `/api/face/register?userId=${currentUser.id}`, {
        faceData,
      });
      return response.json();
    },
    onSuccess: () => {
      if (currentUser) {
        updateCurrentUser({ ...currentUser, isRegistered: true });
      }
      toast({
        title: "Face Registration Complete!",
        description: "Your face has been securely registered",
      });
      setTimeout(() => {
        navigateToNextStep();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const captureFrame = () => {
    if (faceProgress < maxFaceFrames) {
      // Simulate face capture - in real implementation, this would capture from camera
      const mockFaceData = `face_data_${Date.now()}_${faceProgress}`;
      setCapturedFrames(prev => [...prev, mockFaceData]);
      
      const newProgress = faceProgress + 1;
      setFaceProgress(newProgress);
      
      if (newProgress < maxFaceFrames) {
        setCurrentInstruction(newProgress);
      } else {
        // Complete registration
        setIsComplete(true);
        const combinedFaceData = capturedFrames.join(",") + "," + mockFaceData;
        faceRegistrationMutation.mutate(combinedFaceData);
      }
    }
  };

  const navigateToNextStep = () => {
    if (currentUser?.role === "user") {
      setLocation("/company-code");
    } else {
      setLocation("/company-login");
    }
  };

  const progressPercent = (faceProgress / maxFaceFrames) * 100;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Face Registration</h2>
          <p className="text-gray-600">We'll capture your face for secure attendance</p>
        </div>

        {!isComplete ? (
          <>
            {/* Face Scanner Container */}
            <div className="relative mb-8">
              <div className="w-64 h-64 mx-auto rounded-full overflow-hidden bg-gray-100 relative">
                <CameraPreview />
                
                {/* Face Detection Overlay */}
                <div className="absolute inset-4 border-4 border-primary rounded-full face-scanner"></div>
                
                {/* Liveness Detection Instructions */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse-soft">
                    {livenessInstructions[currentInstruction]}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Face samples captured</span>
                <span className="text-sm font-semibold text-primary">{faceProgress}/{maxFaceFrames}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Capture Button */}
            <Button
              onClick={captureFrame}
              className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg mb-4"
              disabled={faceRegistrationMutation.isPending}
            >
              <Camera className="mr-2" size={20} />
              Capture Frame
            </Button>
          </>
        ) : (
          /* Success State */
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
              <Check className="text-2xl text-white" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Registration Complete!</h3>
            <p className="text-gray-600 mb-6">Your face has been securely registered</p>
            <Button
              onClick={navigateToNextStep}
              className="btn-primary text-white px-8 py-3 rounded-2xl font-semibold"
              disabled={faceRegistrationMutation.isPending}
            >
              {faceRegistrationMutation.isPending ? "Processing..." : "Continue"}
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/role-selection")}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
