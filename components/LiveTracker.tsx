'use client'
import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'

export default function LiveTracker({ rideId, isDriver, onLocationUpdate }: { rideId: string, isDriver: boolean, onLocationUpdate: (loc: { lat: number, lng: number }) => void }) {
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-ride', rideId)

    if (isDriver) {
      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            const payload = { rideId, lat, lng }
            socket.emit('update-location', payload)
            onLocationUpdate({ lat, lng })
          },
          (err) => console.error('Tracking Error', err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        )
        return () => navigator.geolocation.clearWatch(watchId)
      }
    } else {
      const handleLocation = (data: { lat: number, lng: number }) => {
        onLocationUpdate({ lat: data.lat, lng: data.lng })
      }
      socket.on('ride:location_update', handleLocation)
      return () => { socket.off('ride:location_update', handleLocation) }
    }
  }, [rideId, isDriver, onLocationUpdate])

  return null // Headless tracking component
}
