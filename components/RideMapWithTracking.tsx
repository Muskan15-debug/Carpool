'use client'
import { useState } from 'react'
import Map from './Map'
import LiveTracker from './LiveTracker'

interface PlaceResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  rideId: string
  isDriver: boolean
  from: PlaceResult
  to: PlaceResult
  encodedPolyline: string | null
}

export default function RideMapWithTracking({ rideId, isDriver, from, to, encodedPolyline }: Props) {
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null)

  return (
    <div className="relative">
      <LiveTracker rideId={rideId} isDriver={isDriver} onLocationUpdate={setDriverLocation} />
      <Map 
        from={from} 
        to={to} 
        encodedPolyline={encodedPolyline} 
        height="250px" 
        driverLocation={driverLocation} 
      />
    </div>
  )
}
