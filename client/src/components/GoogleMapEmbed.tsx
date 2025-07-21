import React from "react";

export default function GoogleMapEmbed({ latitude, longitude, onChange }: {
  latitude: string;
  longitude: string;
  onChange?: (coords: { lat: number; lng: number }) => void;
}) {
  // Use Google Maps JS API for draggable marker if onChange is provided, else embed static map
  const mapRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!onChange) return;
    let map: any = null;
    let marker: any = null;
    function renderMap() {
      // @ts-ignore
      const google = window.google;
      if (!google) return;
      const center = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      // @ts-ignore
      map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 16,
      });
      // @ts-ignore
      marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });
      marker.addListener("dragend", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (onChange) onChange({ lat, lng });
      });
      // Listen for map click to move marker
      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        if (onChange) onChange({ lat, lng });
      });
    }
    // Only load script once
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U`;
      script.async = true;
      script.onload = () => {
        renderMap();
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      renderMap();
    }
    // eslint-disable-next-line
  }, [latitude, longitude, onChange]);

  if (!onChange) {
    // Static embed
    const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          src={src}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  // Interactive map
  return <div ref={mapRef} className="w-full h-64 rounded-lg overflow-hidden mb-6" />;
}
