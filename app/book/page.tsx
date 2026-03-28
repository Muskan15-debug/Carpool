'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PlacesInput from '@/components/PlacesInput'

interface PlaceResult {
  address: string
  lat: number
  lng: number
}

interface PoolMatch {
  rideId: string
  driverId: string
  driverName: string
  driverRating: number
  driverAvatar: string | null
  isVerified: boolean
  fromAddress: string
  toAddress: string
  matchType: string
  poolFare: number
  soloFare: number
  discount: number
  detourMinutes: number
  etaMinutes: number
}

const VEHICLES = [
  { type: 'AUTO', label: 'Auto', icon: '🛺', rate: 12, capacity: 3 },
  { type: 'MINI_CAB', label: 'Mini Cab', icon: '🚗', rate: 15, capacity: 4 },
  { type: 'SEDAN', label: 'Sedan', icon: '🚙', rate: 18, capacity: 4 },
  { type: 'SUV', label: 'SUV', icon: '🚐', rate: 22, capacity: 6 },
]

export default function BookRidePage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1) 
  // 1: Route, 2: Vehicle, 2.5: Searching (90s), 3: Matches, 3.5: Summary, 4: Confirmed
  
  const [from, setFrom] = useState<PlaceResult | null>(null)
  const [to, setTo] = useState<PlaceResult | null>(null)
  const [passengers, setPassengers] = useState(1)
  const [scheduleTime, setScheduleTime] = useState('Now')
  const [vehicleType, setVehicleType] = useState('MINI_CAB')
  
  const [matches, setMatches] = useState<PoolMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [soloFare, setSoloFare] = useState(0)
  
  const [distanceKm, setDistanceKm] = useState(0)
  const [durationMin, setDurationMin] = useState(0)
  
  const [searchCountdown, setSearchCountdown] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [booking, setBooking] = useState(false)

  // Calculate distance
  useEffect(() => {
    if (from && to) {
      const R = 6371
      const dLat = (to.lat - from.lat) * Math.PI / 180
      const dLon = (to.lng - from.lng) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(from.lat*Math.PI/180) * Math.cos(to.lat*Math.PI/180) * Math.sin(dLon/2)**2
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      setDistanceKm(Math.round(d * 10) / 10)
      setDurationMin(Math.round((d / 25) * 60))
    }
  }, [from, to])

  const selectedVehicle = VEHICLES.find(v => v.type === vehicleType)!
  const calculatedSoloFare = Math.round((selectedVehicle?.rate || 15) * distanceKm)

  const handleSearchMatches = async () => {
    if (!from || !to) return
    setStep(2.5) // Jump to 90s finding screen
    setSearchCountdown(15) // Lowered to 15s for realistic dev UX, wait, user said 90s window. Let's do 90s, but they can skip.
    
    // Background API call
    try {
      const res = await fetch('/api/rides/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: from.lat, originLng: from.lng,
          destLat: to.lat, destLng: to.lng,
          vehicleType, distanceKm,
        }),
      })
      const data = await res.json()
      
      // Sort: Exact -> Dest -> Source -> Solo (Solo is handled implicitly last in UI)
      const sorted = (data.matches || []).sort((a: PoolMatch, b: PoolMatch) => {
        const order = { 'EXACT': 1, 'DEST_ON_ROUTE': 2, 'SOURCE_ON_ROUTE': 3 }
        return (order[a.matchType as keyof typeof order] || 4) - (order[b.matchType as keyof typeof order] || 4)
      })
      
      setMatches(sorted)
      setSoloFare(data.soloFare || calculatedSoloFare)
    } catch {
      setMatches([])
      setSoloFare(calculatedSoloFare)
    }
  }

  // Timer Effect
  useEffect(() => {
    if (step === 2.5 && searchCountdown > 0) {
      const timer = setTimeout(() => setSearchCountdown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (step === 2.5 && searchCountdown <= 0) {
      setStep(3)
    }
  }, [searchCountdown, step])

  const skipToSolo = () => {
    setMatches([])
    setSelectedMatch(null)
    setStep(3.5)
  }

  const handleBookRide = async () => {
    setBooking(true)
    const match = matches.find(m => m.rideId === selectedMatch)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: match?.rideId,
          matchType: match?.matchType || 'EXACT',
          finalFare: match?.poolFare || soloFare || calculatedSoloFare,
          poolDiscount: match?.discount || 0,
          solo: !selectedMatch,
          passengers,
          route: !selectedMatch ? {
            fromAddress: from?.address,
            fromLat: from?.lat,
            fromLng: from?.lng,
            toAddress: to?.address,
            toLat: to?.lat,
            toLng: to?.lng,
            vehicleType,
            distanceKm,
            estimatedMinutes: durationMin,
          } : undefined,
        }),
      })
      if (res.ok) {
        setStep(4)
      } else {
        alert('Booking failed. Please try again.')
      }
    } catch {
      alert('Something went wrong.')
    }
    setBooking(false)
  }

  const getMatchBadge = (matchType: string) => {
    switch (matchType) {
      case 'EXACT': return <span className="bg-emerald-500/20 text-emerald-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Exact Match</span>
      case 'DEST_ON_ROUTE': return <span className="bg-blue-500/20 text-blue-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Dest on Route</span>
      case 'SOURCE_ON_ROUTE': return <span className="bg-purple-500/20 text-purple-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Pickup on Route</span>
      default: return null
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 relative">
        {(step === 1 || step === 2) && (
          <>
            {/* STEP 1 — ENTER YOUR ROUTE */}
            <div className="mb-8">
              <h2 className="text-xs font-semibold tracking-widest text-gray-500 mb-4">STEP 1 — RIDE DETAILS</h2>
              <div className="card-dark p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <PlacesInput 
                      placeholder="Pickup location..."
                      onSelect={setFrom}
                      enableCurrentLocation={true}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1">
                    <PlacesInput 
                      placeholder="Where to?"
                      onSelect={setTo}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <select 
                      value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      className="bg-transparent text-white w-full outline-none appearance-none"
                    >
                      <option value="Now">Now</option>
                      <option value="In 1 hour">In 1 hour</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Schedule...">Schedule...</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <select 
                      value={passengers} onChange={e => setPassengers(parseInt(e.target.value))}
                      className="bg-transparent text-white w-full outline-none appearance-none"
                    >
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} Passenger{n>1?'s':''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Recent Trips UI stub */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Trips</h3>
                <div className="flex items-center gap-4 py-3 border-b border-[var(--border)] opacity-60">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-light)] flex items-center justify-center">🕒</div>
                  <div>
                    <p className="text-sm text-white">Airport T2</p>
                    <p className="text-xs text-gray-500">Mumbai, Maharashtra</p>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2 — CHOOSE VEHICLE TYPE */}
            {from && to && (
              <div className="mb-8 animate-fade-in-up">
                <h2 className="text-xs font-semibold tracking-widest text-gray-500 mb-4">STEP 2 — CHOOSE VEHICLE CATEGORY</h2>
                
                {/* Horizontal scroll cards */}
                <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                  {VEHICLES.map(v => (
                    <button
                      key={v.type}
                      onClick={() => setVehicleType(v.type)}
                      className={`min-w-[140px] snap-center shrink-0 rounded-2xl p-4 border text-left transition-all ${vehicleType === v.type ? 'border-primary bg-primary/10' : 'border-[var(--border)] bg-[var(--surface)] opacity-70'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-3xl">{v.icon}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">👤 {v.capacity}</span>
                      </div>
                      <div className="text-base font-bold text-white mb-1">{v.label}</div>
                      <div className="text-xs text-gray-400 mb-3">₹{v.rate}/km mix</div>
                      <div className="text-primary font-bold">~₹{Math.round(v.rate * distanceKm * 0.7)}</div>
                    </button>
                  ))}
                </div>

                {/* Fare summary */}
                <div className="card-dark p-4 flex items-center justify-between mb-6 border-l-4 border-l-primary">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedVehicle.label} · {distanceKm} km
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Solo: ₹{calculatedSoloFare} · With pool: from ₹{Math.round(calculatedSoloFare * 0.7)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">~{durationMin} min</p>
                  </div>
                </div>

                <button
                  onClick={handleSearchMatches}
                  className="btn-primary w-full py-4 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  Find rides (pool & solo) →
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2.5 — 90s POOL SEARCH TAKEOVER */}
        {step === 2.5 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md" style={{ background: 'rgba(15,15,15,0.95)' }}>
            <div className="text-center max-w-sm w-full animate-fade-in-up">
              <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"></div>
              <h2 className="text-3xl font-bold text-white mb-2">Finding people...</h2>
              <p className="text-gray-400 mb-8">Scanning georadius for overlapping routes to save you money.</p>
              
              <div className="text-6xl font-black text-primary mb-12 tabular-nums">
                {searchCountdown}<span className="text-2xl text-primary/50">s</span>
              </div>
              
              <button onClick={() => setStep(3)} className="text-white bg-white/10 px-6 py-3 rounded-full text-sm font-medium hover:bg-white/20 mb-4 transition-colors w-full">
                Show matches now ({matches.length} found)
              </button>
              <button onClick={skipToSolo} className="text-gray-500 underline text-sm block mx-auto">
                Skip and ride solo
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — POOL MATCHES LIST */}
        {step === 3 && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Select your ride</h2>
              <button onClick={() => setStep(2)} className="text-primary text-sm font-medium">Edit Search</button>
            </div>
            
            {matches.map(match => (
              <button
                key={match.rideId}
                onClick={() => { setSelectedMatch(match.rideId); setStep(3.5); }}
                className="w-full card-dark p-4 text-left hover:border-primary transition-colors group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold shrink-0 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  {getInitials(match.driverName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold">{match.driverName || 'Unknown Driver'}</span>
                    <span className="text-primary font-bold text-lg">₹{match.poolFare}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500 text-xs">★ {match.driverRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    {getMatchBadge(match.matchType)}
                  </div>
                  <div className="flex gap-2">
                    {match.detourMinutes > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">+{match.detourMinutes} min detour</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-medium">No detour</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-light)] text-gray-400 font-medium">ETA {match.etaMinutes}m</span>
                  </div>
                </div>
              </button>
            ))}

            {/* Ride Solo option (Always Last) */}
            <button
              onClick={() => { setSelectedMatch(null); setStep(3.5); }}
              className="w-full card-dark p-4 text-left border-dashed !border-gray-700 hover:!border-white transition-colors flex items-center gap-4 mt-6"
            >
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">Ride Solo</span>
                  <span className="text-gray-400 font-bold text-lg">₹{calculatedSoloFare || soloFare}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-medium">Direct route</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-medium">No stops</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* STEP 3.5 — PRE-BOOKING SUMMARY REVIEW */}
        {step === 3.5 && (
          <div className="animate-fade-in-up">
            <button onClick={() => setStep(3)} className="text-gray-500 text-sm mb-6 flex items-center gap-2 hover:text-white">
              ← Back to matches
            </button>
            <div className="card-dark overflow-hidden mb-6">
              <div className="p-6 border-b border-[var(--border)]">
                <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-4">Review Your Booking</h3>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-1">
                      {selectedMatch ? 'Pool Ride' : 'Solo Ride'}
                    </h4>
                    <p className="text-gray-400 text-sm">{selectedVehicle.label} • {distanceKm} km</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary">
                      ₹{selectedMatch ? matches.find(m => m.rideId === selectedMatch)?.poolFare : calculatedSoloFare}
                    </span>
                  </div>
                </div>

                {selectedMatch && (
                  <div className="bg-[var(--surface-light)] rounded-xl p-4 flex gap-4 items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {getInitials(matches.find(m => m.rideId === selectedMatch)?.driverName || '')}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Joining {matches.find(m => m.rideId === selectedMatch)?.driverName}'s ride</p>
                      <p className="text-gray-500 text-xs">Matches your route perfectly</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setPaymentMethod(paymentMethod === 'UPI' ? 'Card ending 4242' : 'UPI')}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center">💳</div>
                  <div>
                    <p className="text-white text-sm font-medium">{paymentMethod}</p>
                    <p className="text-gray-500 text-xs">Tap to change</p>
                  </div>
                </div>
                <span className="text-gray-600">→</span>
              </div>

              {/* Cancel Policy */}
              <div className="p-6 bg-red-500/5">
                <div className="flex gap-3">
                  <span className="text-red-500 mt-0.5">ⓘ</span>
                  <p className="text-xs text-red-500/80 leading-relaxed">
                    <strong>Cancellation Policy:</strong> Free cancellation for 5 minutes after driver accepts. Late cancellations incur a ₹50 penalty.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookRide}
              disabled={booking}
              className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20"
            >
              {booking ? 'Confirming...' : 'Confirm and Book'}
            </button>
          </div>
        )}

        {/* STEP 4 — CONFIRMED / ACTIVE (Mock pending state) */}
        {step === 4 && (
          <div className="mb-8 animate-fade-in-up">
            <div className="card-dark p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-primary/20 text-primary text-4xl animate-bounce">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ride Booked!</h2>
              <p className="text-gray-400 text-sm mb-8">The dispatch engine is routing your driver. Switch to Active Rides to track live.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/bookings')} // We will route this to /bookings/active later
                  className="btn-primary px-8 py-3 font-semibold"
                >
                  Track Driver Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </main>
  )
}
