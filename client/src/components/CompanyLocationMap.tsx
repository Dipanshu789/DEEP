import { useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "300px" };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

export default function CompanyLocationMap({ value, onChange }: {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: "AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U" });
  const [marker, setMarker] = useState(value || defaultCenter);

  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={marker}
      zoom={15}
      onClick={e => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat && lng) {
          setMarker({ lat, lng });
          onChange({ lat, lng });
        }
      }}
    >
      <Marker
        position={marker}
        draggable
        onDragEnd={e => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (lat && lng) {
            setMarker({ lat, lng });
            onChange({ lat, lng });
          }
        }}
      />
    </GoogleMap>
  );
}
