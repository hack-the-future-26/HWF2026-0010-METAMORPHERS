import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import { mapsService } from '@/services/mapsService'

const pin = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:999px;background:#c45c26;border:3px solid white;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function Invalidate() {
  const map = useMap()
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 60)
    return () => window.clearTimeout(t)
  }, [map])
  return null
}

export function PlaceMiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="mb-4 h-52 overflow-hidden rounded-3xl">
      <MapContainer
        key={`${lat.toFixed(5)},${lng.toFixed(5)}`}
        center={[lat, lng]}
        zoom={16}
        className="map-tiles h-full w-full"
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer attribution={mapsService.attribution} url={mapsService.lightTiles} />
        <Invalidate />
        <Marker position={[lat, lng]} icon={pin} />
      </MapContainer>
    </div>
  )
}
