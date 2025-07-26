import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';


interface MarkerWithIcon {
  lat: number;
  lng: number;
  label?: string;
  iconUrl?: string;
  iconSize?: { width: number; height: number };
}

interface GoogleMapViewProps {
  markers?: MarkerWithIcon[];
  center?: { lat: number; lng: number };
  zoom?: number;
}



const GOOGLE_MAPS_API_KEY = "AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U";

const GoogleMapView = ({ markers = [], center = { lat: 28.6139, lng: 77.209 }, zoom = 12 }: GoogleMapViewProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) {
    return <div style={{ width: '100%', height: '100%' }}>Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
    >
      {markers.map((marker, idx) => {
        let icon = undefined;
        if (marker.iconUrl) {
          icon = {
            url: marker.iconUrl,
            scaledSize: marker.iconSize && window.google && window.google.maps && window.google.maps.Size
              ? new window.google.maps.Size(marker.iconSize.width, marker.iconSize.height)
              : undefined,
          };
        }
        // Add zIndex for user marker to ensure it's visible above company marker
        let zIndex = 1;
        if (marker.label && (marker.label === "You" || marker.label === "User")) {
          zIndex = 999;
        }
        return (
          <Marker
            key={idx}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={marker.label}
            icon={icon}
            zIndex={zIndex}
          />
        );
      })}
    </GoogleMap>
  );
};

export default GoogleMapView;
