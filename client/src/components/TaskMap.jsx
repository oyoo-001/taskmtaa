import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function TaskMap({ tasks, userLocation }) {
  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker */}
      <Circle
        center={[userLocation.latitude, userLocation.longitude]}
        radius={100}
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}
      />

      {/* Task markers */}
      {tasks.map((task) => (
        <Marker
          key={task.id}
          position={[task.latitude, task.longitude]}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
              <div className="space-y-1 text-xs">
                <p className="font-medium text-green-600">
                  KSh {task.budget?.toLocaleString()}
                </p>
                <p className="text-gray-500">{task.category}</p>
                {task.distance_formatted && (
                  <p className="text-primary-600">{task.distance_formatted} away</p>
                )}
              </div>
              <Link
                to={`/tasks/${task.id}`}
                className="inline-block mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
              >
                View Details
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
