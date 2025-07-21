import { useEffect } from "react";
import { Clock } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="mb-6">
          <Clock className="mx-auto text-6xl mb-4 h-16 w-16" />
          <h1 className="text-4xl font-bold mb-2">D.E.E.P</h1>
          <p className="text-xl opacity-90">Document Engage Evaluate Plan
</p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
}
