import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair } from "lucide-react";
import GoogleMapEmbed from "./GoogleMapEmbed";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Company } from "@shared/schema";

interface GeofenceSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function GeofenceSetup({ onComplete, onBack }: GeofenceSetupProps) {
  const [locationMethod, setLocationMethod] = useState<"manual" | "auto">("auto");
  const [coordinates, setCoordinates] = useState({
    latitude: "12.9716",
    longitude: "77.5946",
  });
  const { toast } = useToast();

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company/admin/me"],
  });

  const createGeofenceMutation = useMutation({
    mutationFn: async (data: { latitude: string; longitude: string; companyCode: string }) => {
      return apiRequest("POST", "/api/geofence", {
        companyCode: data.companyCode,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: 920,
        radius: 100,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Geofence setup completed successfully!",
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
        description: "Failed to setup geofence. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        toast({
          title: "Success",
          description: "Current location detected successfully!",
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: "Unable to get current location. Please enter manually.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmit = () => {
    if (!company?.companyCode) {
      toast({
        title: "Error",
        description: "Company information not found.",
        variant: "destructive",
      });
      return;
    }

    createGeofenceMutation.mutate({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      companyCode: company.companyCode,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full fade-in">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <MapPin className="mx-auto text-4xl text-primary mb-4 h-12 w-12" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Office Location</h2>
              <p className="text-gray-600">Define where employees can check in</p>
            </div>

            {/* Location Setup Options */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => setLocationMethod("manual")}
                className={`border-2 rounded-lg p-4 text-left transition-colors ${
                  locationMethod === "manual" 
                    ? "border-primary bg-blue-50" 
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                <MapPin className="text-primary text-2xl mb-2 h-8 w-8" />
                <h3 className="font-semibold mb-2">Manual Pin Drop</h3>
                <p className="text-gray-600 text-sm">Enter coordinates manually</p>
              </button>
              
              <button
                onClick={() => {
                  setLocationMethod("auto");
                  getCurrentLocation();
                }}
                className={`border-2 rounded-lg p-4 text-left transition-colors ${
                  locationMethod === "auto" 
                    ? "border-primary bg-blue-50" 
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                <Crosshair className="text-primary text-2xl mb-2 h-8 w-8" />
                <h3 className="font-semibold mb-2">Use Current Location</h3>
                <p className="text-gray-600 text-sm">Automatically detect current GPS coordinates</p>
              </button>
            </div>

            {/* Real Google Map for office location selection */}
            <GoogleMapEmbed
              latitude={coordinates.latitude}
              longitude={coordinates.longitude}
              onChange={coords => setCoordinates({ latitude: coords.lat.toString(), longitude: coords.lng.toString() })}
            />

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="floating-label">
                <input
                  type="text"
                  placeholder=" "
                  value={coordinates.latitude}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Latitude</label>
              </div>
              <div className="floating-label">
                <input
                  type="text"
                  placeholder=" "
                  value={coordinates.longitude}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Longitude</label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Location Settings</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Radius:</strong> 100 meters</p>
                <p><strong>Altitude:</strong> 920m above sea level</p>
                <p><strong>Accuracy:</strong> High precision GPS required</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createGeofenceMutation.isPending}
                className="flex-1 btn-secondary"
              >
                {createGeofenceMutation.isPending ? "Setting up..." : "Complete Setup & Go to Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
