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
}

export default function PlacesInput({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
          className="w-full pl-10 pr-4 border border-gray-200 p-3 rounded-xl text-sm bg-white"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white mt-1.5 border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((feature) => (
            <li 
              key={feature.id}
              onClick={() => handleSelect(feature)}
              className="px-4 py-3 hover:bg-primary-lighter cursor-pointer border-b border-gray-50 last:border-0 text-sm text-gray-700 flex items-start gap-2.5 transition-colors"
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