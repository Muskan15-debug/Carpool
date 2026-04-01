// Fare calculation engine for Uber-style pricing
export const VEHICLE_RATES: Record<string, { ratePerKm: number; label: string; icon: string }> = {
  AUTO: { ratePerKm: 12, label: 'Auto', icon: '🛺' },
  MINI_CAB: { ratePerKm: 15, label: 'Mini Cab', icon: '🚗' },
  SEDAN: { ratePerKm: 18, label: 'Sedan', icon: '🚙' },
  SUV: { ratePerKm: 22, label: 'SUV', icon: '🚐' },
}

export const POOL_DISCOUNTS: Record<string, number> = {
  EXACT: 0.30,           // 30% off
  DEST_ON_ROUTE: 0.20,   // 20% off
  SOURCE_ON_ROUTE: 0.23, // 23% off
}

export function calculateSoloFare(vehicleType: string, distanceKm: number): number {
  const rate = VEHICLE_RATES[vehicleType]
  if (!rate) return 0
  return Math.round(rate.ratePerKm * distanceKm)
}

export function calculatePoolFare(vehicleType: string, distanceKm: number, matchType: string): number {
  const soloFare = calculateSoloFare(vehicleType, distanceKm)
  const discount = POOL_DISCOUNTS[matchType] || 0
  return Math.round(soloFare * (1 - discount))
}

export function getDiscountPercent(matchType: string): number {
  return Math.round((POOL_DISCOUNTS[matchType] || 0) * 100)
}

export function estimateTime(distanceKm: number): number {
  // Rough estimate: avg 25 km/h in city traffic
  return Math.round((distanceKm / 25) * 60)
}

export async function getRouteInfo(
  fromLat: number, fromLng: number, toLat: number, toLng: number
): Promise<{ distanceKm: number; durationMin: number; polyline: string | null }> {
  const mapboxKey = process.env.MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY
  if (!mapboxKey) {
    // Haversine fallback
    const R = 6371
    const dLat = (toLat - fromLat) * Math.PI / 180
    const dLon = (toLng - fromLng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(fromLat*Math.PI/180) * Math.cos(toLat*Math.PI/180) * Math.sin(dLon/2)**2
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return { distanceKm: Math.round(d * 10) / 10, durationMin: estimateTime(d), polyline: null }
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=polyline&access_token=${mapboxKey}`
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0]
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      polyline: route.geometry || null,
    }
  }
  
  return { distanceKm: 0, durationMin: 0, polyline: null }
}
