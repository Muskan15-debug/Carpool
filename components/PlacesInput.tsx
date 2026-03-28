'use client'
import { useState, useRef } from 'react'

interface PlaceResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  placeholder: string
  onSelect: (result: PlaceResult) => void
  enableCurrentLocation?: boolean
}

export default function PlacesInput({ placeholder, onSelect, enableCurrentLocation = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`)
          const data = await res.json()
          
          let address = 'Current Location'
          if (data.features && data.features.length > 0) address = data.features[0].place_name
          
          setQuery(address)
          onSelect({ address, lat, lng })
        } catch (e) {
          console.error("Reverse geocoding error", e)
          setQuery('Current Location')
          onSelect({ address: 'Current Location', lat, lng })
        } finally {
          setFetchingLocation(false)
        }
      },
      (err) => {
        // Use warn instead of error to prevent Next.js dev overlay from popping up
        console.warn('Geolocation warning:', err.message, err.code)
        
        let msg = 'Could not fetch your location.'
        if (err.code === 1) msg = 'Location permission denied by browser.'
        if (err.code === 2) msg = 'Location is unavailable on this device.'
        if (err.code === 3) msg = 'Location request timed out.'
        
        alert(`${msg} Please check your browser permissions.`)
        setFetchingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  const handleSearch = (text: string) => {
    setQuery(text)
    if (text.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(async () => {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';
      if (!mapboxToken) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
        )
        const data = await res.json()
        setResults(data.features || [])
        setIsOpen(true)
      } catch (e) {
        console.error("Mapbox search error", e)
      }
    }, 400)
  }

  const handleSelect = (feature: any) => {
    setQuery(feature.place_name)
    setIsOpen(false)
    onSelect({
      address: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0]
    })
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className={`w-full pl-10 ${enableCurrentLocation ? 'pr-12' : 'pr-4'} p-3 rounded-xl text-sm text-white`}
          style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
        />
        
        {enableCurrentLocation && (
          <button
            onClick={(e) => { e.preventDefault(); handleCurrentLocation(); }}
            disabled={fetchingLocation}
            title="Use current location"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
          >
            {fetchingLocation ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1.5 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {results.map((feature) => (
            <li 
              key={feature.id}
              onClick={() => handleSelect(feature)}
              className="px-4 py-3 cursor-pointer last:border-0 text-sm text-gray-300 flex items-start gap-2.5 transition-colors hover:text-white"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{feature.place_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}