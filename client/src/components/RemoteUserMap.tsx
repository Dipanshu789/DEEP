import React from "react";

interface RemoteUser {
  userId: string;
  lat: number;
  lon: number;
  name: string;
  profileImageUrl?: string;
}

interface RemoteUserMapProps {
  users: RemoteUser[];
}

export default function RemoteUserMap({ users }: RemoteUserMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    if (window.google && window.google.maps && mapRef.current && !mapLoaded) {
      setMapLoaded(true);
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: users[0]?.lat || 20.5937, lng: users[0]?.lon || 78.9629 },
        zoom: 5,
      });
      users.forEach((user) => {
        // Create a circular marker icon using SVG data URL if profileImageUrl exists
        let markerIcon = undefined;
        if (user.profileImageUrl) {
          const svg = `
            <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
              <circle cx='24' cy='24' r='24' fill='#fff' />
              <clipPath id='circleClip'><circle cx='24' cy='24' r='22'/></clipPath>
              <image href='${user.profileImageUrl}' x='2' y='2' width='44' height='44' clip-path='url(#circleClip)' preserveAspectRatio='xMidYMid slice'/>
              <circle cx='24' cy='24' r='22' fill='none' stroke='#22c55e' stroke-width='2'/>
            </svg>
          `;
          markerIcon = {
            url: 'data:image/svg+xml;base64,' + btoa(svg),
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 24),
          };
        }
        const marker = new window.google.maps.Marker({
          position: { lat: user.lat, lng: user.lon },
          map,
          title: user.name,
          icon: markerIcon,
        });
        // Add info window with name and profile image
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style='display:flex;align-items:center;gap:10px;'>
            ${user.profileImageUrl ? `<img src='${user.profileImageUrl}' style='width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #22c55e;box-shadow:0 2px 8px #0002;display:inline-block;' />` : ''}
            <span style='font-weight:bold;font-size:1.1em;'>${user.name}</span>
          </div>`
        });
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    }
    // Dynamically load Google Maps script if not present
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U';
      script.async = true;
      script.onload = () => {
        setMapLoaded(false); // Will trigger re-run above
      };
      document.body.appendChild(script);
    }
  }, [users, mapLoaded]);

  return (
    <div className="w-full h-[400px] relative bg-gray-100 rounded-xl shadow-lg overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg font-bold bg-white/80 z-10">
          Loading map...
        </div>
      )}
    </div>
  );
}
