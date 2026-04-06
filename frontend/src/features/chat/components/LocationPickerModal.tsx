import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from '../../../components/Dialog';
import { Search, MapPin } from 'lucide-react';
import Logger from '../../../lib/logger';

// Fix leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function ChangeView({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export const LocationPickerModal = ({
  isOpen,
  onClose,
  onSelect,
}: LocationPickerModalProps) => {
  const [position, setPosition] = useState<L.LatLng>(
    new L.LatLng(-6.2, 106.816666),
  ); // Default Jakarta
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
      });
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setPosition(new L.LatLng(parseFloat(lat), parseFloat(lon)));
      }
    } catch (err) {
      Logger.error('Search failed:', err);
    }
  };

  const handleConfirm = () => {
    onSelect({
      latitude: position.lat,
      longitude: position.lng,
      address: search || 'Selected Location',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pick a Location">
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search for a place..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
            <ChangeView center={position} />
          </MapContainer>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </Modal>
  );
};
