import React from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';


interface MarkerWithIcon {
  lat: number;
  lng: number;
  label?: string;
  iconUrl?: string;
  iconSize?: { width: number; height: number };
  route?: { lat: number; lon?: number; lng?: number; timestamp?: number }[];
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

  // Live tracking logic: Only show remote_users who are checked in and not checked out
  // Expect markers prop to contain only those users (filtered in parent component)

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
          // Render circular marker icon using SVG data URL
          const size = marker.iconSize?.width || 48;
          const svg = `
            <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
              <circle cx='${size/2}' cy='${size/2}' r='${size/2}' fill='#fff' />
              <clipPath id='circleClip'><circle cx='${size/2}' cy='${size/2}' r='${size/2-2}'/></clipPath>
              <image href='${marker.iconUrl}' x='2' y='2' width='${size-4}' height='${size-4}' clip-path='url(#circleClip)' preserveAspectRatio='xMidYMid slice'/>
              <circle cx='${size/2}' cy='${size/2}' r='${size/2-2}' fill='none' stroke='#22c55e' stroke-width='2'/>
            </svg>
          `;
          icon = {
            url: 'data:image/svg+xml;base64,' + btoa(svg),
            scaledSize: window.google && window.google.maps && window.google.maps.Size
              ? new window.google.maps.Size(size, size)
              : undefined,
          };
        }
        let zIndex = 1;
        if (marker.label && (marker.label === "You" || marker.label === "User")) {
          zIndex = 999;
        }
        // Custom label styling: bold, eye-catching color
        let label = undefined;
        if (marker.label) {
          label = {
            text: marker.label,
            color: '#090909ff', // Deep blue for company/user name
            fontWeight: 'bold',
            fontSize: '17px',
            className: 'map-marker-label',
          };
        }
        // Draw animated polyline for route if available
        let routePath: { lat: number; lng: number }[] = [];
        if (marker.route && marker.route.length > 1) {
          routePath = marker.route
            .map((pt) => {
              const lng = pt.lng !== undefined ? pt.lng : pt.lon;
              if (lng === undefined) return undefined;
              return {
                lat: pt.lat,
                lng: lng,
              };
            })
            .filter((pt): pt is { lat: number; lng: number } => pt !== undefined);
        }
        return (
          <React.Fragment key={idx}>
            {routePath.length > 1 && (
              <Polyline
                path={routePath}
                options={{
                  strokeColor: '#1976d2',
                  strokeOpacity: 0.7,
                  strokeWeight: 4,
                  icons: [
                    {
                      icon: { path: window.google.maps.SymbolPath.FORWARD_OPEN_ARROW },
                      offset: '100%',
                    },
                  ],
                }}
              />
            )}
            <Marker
              position={routePath.length > 0 ? routePath[routePath.length - 1] : { lat: marker.lat, lng: marker.lng }}
              label={label}
              icon={icon}
              zIndex={zIndex}
              animation={window.google && window.google.maps ? window.google.maps.Animation.DROP : undefined}
            />
          </React.Fragment>
        );
      })}
    </GoogleMap>
  );
};

export default GoogleMapView;
