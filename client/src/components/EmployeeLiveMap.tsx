import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "350px" };

export default function EmployeeLiveMap({ employees }: {
  employees: Array<{ id: string; fullName: string; lat?: number; lng?: number }>;
}) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: "AIzaSyC-ml0XJ8maz8kj9nJj7F3seopwhzia09U" });
  const validEmployees = employees.filter(e => e.lat && e.lng);
  const center = validEmployees.length > 0 ? { lat: validEmployees[0].lat!, lng: validEmployees[0].lng! } : { lat: 28.6139, lng: 77.2090 };

  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
    >
      {validEmployees.map(emp => (
        <Marker key={emp.id} position={{ lat: emp.lat!, lng: emp.lng! }} label={emp.fullName} />
      ))}
    </GoogleMap>
  );
}
