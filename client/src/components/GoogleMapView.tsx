import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface GoogleMapViewProps {
  markers?: { lat: number; lng: number; label?: string }[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function GoogleMapView({ markers = [], center = { lat: 28.6139, lng: 77.209 }, zoom = 12 }: GoogleMapViewProps) {
  return (
    <LoadScript googleMapsApiKey="AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
      >
        {markers.map((marker, idx) => (
          <Marker key={idx} position={{ lat: marker.lat, lng: marker.lng }} label={marker.label} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
