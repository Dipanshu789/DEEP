import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLocation("/welcome"), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [setLocation]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary to-blue-600 text-white z-50">
      <div className="animate-bounce-gentle mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
          <Shield className="text-3xl text-primary" size={32} />
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-2">Smart Attendance</h1>
      <p className="text-blue-100 mb-8">Secure & Corruption-Free</p>
      <div className="w-48 h-2 bg-blue-400 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-blue-100 text-sm mt-4">Loading...</p>
    </div>
  );
}
