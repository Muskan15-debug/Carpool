'use client'
import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
      libraries: ['places']
    })

    loader.load().then(() => {
      if (!inputRef.current) return
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current)
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry?.location) return
        onSelect({
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      })
    })
  }, [])

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
    />
  )
}