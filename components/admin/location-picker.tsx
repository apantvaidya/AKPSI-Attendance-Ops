"use client";

import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

type Props = {
  initialLat?: number;
  initialLng?: number;
  onChange: (coords: { lat: number; lng: number }) => void;
};

function ClickHandler({
  onPick,
}: {
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export function LocationPicker({ initialLat = 32.8801, initialLng = -117.234, onChange }: Props) {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const center = useMemo(() => [initialLat, initialLng] as [number, number], [initialLat, initialLng]);

  return (
    <div className="space-y-3">
      <div className="h-80 overflow-hidden rounded-2xl border border-brand-100">
        <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler
            onPick={(coords) => {
              setPosition(coords);
              onChange(coords);
            }}
          />
          <CircleMarker
            center={[position.lat, position.lng]}
            radius={10}
            pathOptions={{ color: "#8b6424", fillColor: "#c6a15c", fillOpacity: 0.9 }}
          />
        </MapContainer>
      </div>
      <p className="text-sm text-brand-700">
        Click the map to set the attendance center pin. Current pin: {position.lat.toFixed(6)},{" "}
        {position.lng.toFixed(6)}
      </p>
    </div>
  );
}
