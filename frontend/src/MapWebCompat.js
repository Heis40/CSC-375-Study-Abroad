/**
 * Web-compatible drop-in replacement for react-native-maps.
 * Uses react-leaflet + OpenStreetMap tiles. No API key required.
 */
import React from 'react';
import { View } from 'react-native';

// Inject Leaflet CSS from CDN — no build step needed
if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const L = require('leaflet');
const { MapContainer, TileLayer, Marker: LMarker, Polygon: LPolygon, useMapEvents } = require('react-leaflet');

// Fix Leaflet's default marker icon broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Bridges Leaflet click events to react-native-maps' onPress signature
function MapClickHandler({ onPress }) {
  useMapEvents({
    click(e) {
      if (onPress) {
        onPress({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
      }
    },
  });
  return null;
}

function latDeltaToZoom(latitudeDelta) {
  return Math.round(Math.log2(180 / latitudeDelta));
}

function MapView({ style, initialRegion, onPress, children }) {
  const center = initialRegion
    ? [initialRegion.latitude, initialRegion.longitude]
    : [52.668, -8.63];
  const zoom = initialRegion ? latDeltaToZoom(initialRegion.latitudeDelta) : 10;

  return (
    <View style={[{ height: 350 }, style]}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPress && <MapClickHandler onPress={onPress} />}
        {children}
      </MapContainer>
    </View>
  );
}

export function Marker({ coordinate }) {
  if (!coordinate) return null;
  return <LMarker position={[coordinate.latitude, coordinate.longitude]} />;
}

export function Polygon({ coordinates, fillColor, strokeColor, strokeWidth }) {
  if (!coordinates || coordinates.length < 3) return null;
  return (
    <LPolygon
      positions={coordinates.map(c => [c.latitude, c.longitude])}
      pathOptions={{
        fillColor: fillColor || 'rgba(34,197,94,0.3)',
        fillOpacity: 0.3,
        color: strokeColor || '#166534',
        weight: strokeWidth || 2,
      }}
    />
  );
}

export default MapView;
