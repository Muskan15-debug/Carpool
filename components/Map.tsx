'use client'
import 'mapbox-gl/dist/mapbox-gl.css'
// @ts-ignore
import MapboxMap, { Source, Layer, Marker } from 'react-map-gl/mapbox'
import { useEffect, useState, useMemo } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''

interface PlaceResult {
  address: string
  lat: number
  lng: number
}

interface MapProps {
  from?: PlaceResult | null
  to?: PlaceResult | null
  encodedPolyline?: string | null
  height?: string
  driverLocation?: { lat: number; lng: number } | null
}

function decodePolyline(encoded: string) {
  const points: number[][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
    points.push([lng / 1e5, lat / 1e5]); // Note: GeoJSON uses [lng, lat]
  }
  return points;
}

export default function Map({ from, to, encodedPolyline, height = '300px', driverLocation }: MapProps) {
  const [mounted, setMounted] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: 77.2090, // default Delhi
    latitude: 28.6139,
    zoom: 10
  })

  // Prevent SSR crashing Mapbox by only rendering when mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Center map based on markers
  useEffect(() => {
    if (from && to) {
      setViewState({
        longitude: (from.lng + to.lng) / 2,
        latitude: (from.lat + to.lat) / 2,
        zoom: 10 // Simplistic zoom
      })
    } else if (from) {
      setViewState({ longitude: from.lng, latitude: from.lat, zoom: 12 })
    } else if (to) {
      setViewState({ longitude: to.lng, latitude: to.lat, zoom: 12 })
    }
  }, [from, to])

  const routeGeojson = useMemo(() => {
    if (!encodedPolyline) return null
    try {
      const coordinates = decodePolyline(encodedPolyline)
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    } catch (e) {
      console.error('Failed to decode polyline', e)
      return null
    }
  }, [encodedPolyline])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full flex items-center justify-center bg-gray-100 rounded-xl" style={{ height }}>
        <p className="text-sm text-gray-500">Mapbox Token Missing</p>
      </div>
    )
  }

  if (!mounted) {
    return <div className="w-full bg-gray-100 rounded-xl animate-pulse" style={{ height }} />
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-sm" style={{ height }}>
      <MapboxMap
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {from && (
          <Marker longitude={from.lng} latitude={from.lat} color="#4F46E5" />
        )}
        {to && (
          <Marker longitude={to.lng} latitude={to.lat} color="#4338CA" />
        )}
        
        {routeGeojson && (
          <Source id="route" type="geojson" data={routeGeojson as any}>
            <Layer
              id="route-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#4F46E5',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {driverLocation && (
          <Marker longitude={driverLocation.lng} latitude={driverLocation.lat}>
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center text-[10px]">
              🚗
            </div>
          </Marker>
        )}
      </MapboxMap>
    </div>
  )
}
