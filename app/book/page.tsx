'use client'
import { useState, useEffect, useRef } from 'react'
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
  passengerName: string
  passengerRating: number
  passengerAvatar: string | null
  isVerified: boolean
  fromAddress: string
  toAddress: string
  matchType: string
  poolFare: number
  soloFare: number
  discount: number
  detourMinutes: number
  etaMinutes: number
  pickupDiffKm?: number
  dropDiffKm?: number
}

const VEHICLES = [
  { type: 'AUTO', label: 'Auto', icon: '🛺', rate: 12, capacity: 3 },
  { type: 'MINI_CAB', label: 'Mini Cab', icon: '🚗', rate: 15, capacity: 4 },
  { type: 'SEDAN', label: 'Sedan', icon: '🚙', rate: 18, capacity: 4 },
  { type: 'SUV', label: 'SUV', icon: '🚐', rate: 22, capacity: 6 },
]

const STATUS_TEXTS = [
  'Running GEORADIUS passenger routing scan…',
  'Checking route polyline overlaps…',
  'Calculating detour savings…',
  'Scoring matches by distance delta…',
  'Filtering by vehicle type…',
  'Almost there — sorting results…',
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

  const [searchCountdown, setSearchCountdown] = useState(90)
  const [statusTextIdx, setStatusTextIdx] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [booking, setBooking] = useState(false)
  const [ratingComment, setRatingComment] = useState('')

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    setStep(2.5)
    setSearchCountdown(90)
    setStatusTextIdx(0)

    // Cycle status text every 12s
    statusIntervalRef.current = setInterval(() => {
      setStatusTextIdx(prev => (prev + 1) % STATUS_TEXTS.length)
    }, 12000)

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

      const order: Record<string, number> = { 'EXACT': 1, 'DEST_ON_ROUTE': 2, 'SOURCE_ON_ROUTE': 3 }
      const sorted = (data.matches || []).sort((a: PoolMatch, b: PoolMatch) =>
        (order[a.matchType] || 4) - (order[b.matchType] || 4)
      )
      setMatches(sorted)
      setSoloFare(data.soloFare || calculatedSoloFare)
    } catch {
      setMatches([])
      setSoloFare(calculatedSoloFare)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (step === 2.5 && searchCountdown > 0) {
      const timer = setTimeout(() => setSearchCountdown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (step === 2.5 && searchCountdown <= 0) {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
      setStep(3)
    }
  }, [searchCountdown, step])

  // Clean up status interval when leaving step 2.5
  useEffect(() => {
    if (step !== 2.5 && statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
    }
  }, [step])

  const skipToSolo = () => {
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
    setMatches([])
    setSelectedMatch(null)
    setStep(3.5)
  }

  const showResults = () => {
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
    setStep(3)
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
          solo: selectedMatch === null,
          newPool: selectedMatch === 'NEW_POOL',
          passengers,
          route: (!selectedMatch || selectedMatch === 'NEW_POOL') ? {
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
        // Redirect to live tracking after 1.5s
        setTimeout(() => router.push('/book/active'), 1500)
      } else {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || 'Booking failed. Please try again.')
      }
    } catch {
      alert('Something went wrong.')
    }
    setBooking(false)
  }

  const getMatchBadgeType = (matchType: string) => {
    switch (matchType) {
      case 'EXACT': return 'exact'
      case 'DEST_ON_ROUTE': return 'dest'
      case 'SOURCE_ON_ROUTE': return 'source'
      default: return null
    }
  }

  const getMatchLabel = (matchType: string) => {
    switch (matchType) {
      case 'EXACT': return 'Type A — Exact Match'
      case 'DEST_ON_ROUTE': return 'Type B — Dest on route'
      case 'SOURCE_ON_ROUTE': return 'Type C — Pickup on route'
      default: return ''
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const anonymiseName = (name: string | null) => {
    if (!name) return 'Co-passenger'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1][0]}.`
  }

  const countdownPct = ((90 - searchCountdown) / 90) * 100

  const selectedMatchData = matches.find(m => m.rideId === selectedMatch)
  const isNewPool = selectedMatch === 'NEW_POOL'
  const calculatedPoolFareForNew = Math.round((soloFare || calculatedSoloFare) * 0.65)
  const finalFare = isNewPool ? calculatedPoolFareForNew : (selectedMatchData?.poolFare ?? (soloFare || calculatedSoloFare))
  const poolDiscount = isNewPool ? ((soloFare || calculatedSoloFare) - calculatedPoolFareForNew) : (selectedMatchData ? Math.round((selectedMatchData.soloFare || calculatedSoloFare) - selectedMatchData.poolFare) : 0)
  const baseFare = finalFare + poolDiscount

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 relative">

        {/* ═══════════════════════════════════════════════
            STEP 1 + 2 — ROUTE + VEHICLE
        ═══════════════════════════════════════════════ */}
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

                {/* Route line connector */}
                <div className="flex items-center gap-3 pl-1">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-red-500 rounded-full mx-auto ml-0.5" style={{ width: '2px' }} />
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

              {/* Recent Trips stub */}
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

            {/* STEP 2 — CHOOSE VEHICLE */}
            {from && to && (
              <div className="mb-8 animate-fade-in-up">
                <h2 className="text-xs font-semibold tracking-widest text-gray-500 mb-4">STEP 2 — CHOOSE VEHICLE CATEGORY</h2>

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
                      <div className="text-xs text-gray-400 mb-3">₹{v.rate}/km</div>
                      <div className="text-primary font-bold">~₹{Math.round(v.rate * distanceKm * 0.7)}</div>
                    </button>
                  ))}
                </div>

                <div className="card-dark p-4 flex items-center justify-between mb-6 border-l-4 border-l-primary">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedVehicle.label} · {distanceKm} km
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Solo: ₹{calculatedSoloFare} · Pool: from ₹{Math.round(calculatedSoloFare * 0.65)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">~{durationMin} min</p>
                    <p className="text-xs text-gray-500">{distanceKm} km</p>
                  </div>
                </div>

                <button
                  onClick={handleSearchMatches}
                  className="btn-primary w-full py-4 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  Find pool matches →
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 2.5 — ANIMATED POOL SEARCH TAKEOVER
        ═══════════════════════════════════════════════ */}
        {step === 2.5 && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 60%, #0f0f0f 100%)' }}>

            {/* Radar ring animation */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-10">
              <div className="radar-ring radar-ring-2" style={{ width: '80px', height: '80px', left: '50%', top: '50%' }} />
              <div className="radar-ring radar-ring-2" style={{ width: '80px', height: '80px', left: '50%', top: '50%', animationDelay: '0.85s' }} />
              <div className="radar-ring radar-ring-3" style={{ width: '80px', height: '80px', left: '50%', top: '50%', animationDelay: '1.7s' }} />

              {/* Center icon */}
              <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '2px solid rgba(16,185,129,0.4)' }}>
                <span className="text-4xl" style={{ animation: 'driverBounce 2s ease-in-out infinite' }}>🔍</span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-3xl font-black text-white mb-2 text-center leading-tight">
              Finding people<br />travelling your way…
            </h2>
            <p className="text-gray-500 text-sm mb-3 text-center max-w-xs animate-status-pulse">
              {STATUS_TEXTS[statusTextIdx]}
            </p>

            {/* Match count badge */}
            {matches.length > 0 && (
              <div className="mb-4 px-4 py-1.5 rounded-full text-xs font-bold animate-fade-in"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✓ {matches.length} match{matches.length !== 1 ? 'es' : ''} found so far
              </div>
            )}

            {/* Big countdown */}
            <div className="text-7xl font-black text-primary mb-3 tabular-nums" style={{ textShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
              {searchCountdown}<span className="text-3xl text-primary/40">s</span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs h-1 rounded-full mb-8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${100 - countdownPct}%`,
                  background: 'linear-gradient(90deg, #10B981, #059669)',
                  boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                }}
              />
            </div>

            {/* Actions */}
            <button
              onClick={showResults}
              className="w-full max-w-xs py-4 rounded-2xl font-bold text-white mb-3 transition-all hover:bg-white/15"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Show results now {matches.length > 0 && `— ${matches.length} found`}
            </button>
            <button
              onClick={skipToSolo}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors underline underline-offset-4"
            >
              Skip to solo ride
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 3 — POOL MATCHES
        ═══════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="animate-fade-in-up space-y-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Select your ride</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {from?.address?.split(',')[0]} → {to?.address?.split(',')[0]}
                </p>
              </div>
              <button onClick={() => setStep(2)} className="text-primary text-sm font-medium">Edit →</button>
            </div>

            {/* Type A — Exact matches */}
            {matches.filter(m => m.matchType === 'EXACT').length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 pl-1">Type A — Exact Match</p>
                {matches.filter(m => m.matchType === 'EXACT').map(match => (
                  <MatchCard
                    key={match.rideId}
                    match={match}
                    badgeType="exact"
                    getInitials={getInitials}
                    onSelect={() => { setSelectedMatch(match.rideId); setStep(3.5) }}
                  />
                ))}
              </div>
            )}

            {/* Type B — Dest on route */}
            {matches.filter(m => m.matchType === 'DEST_ON_ROUTE').length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 pl-1">Type B — Dest on route</p>
                {matches.filter(m => m.matchType === 'DEST_ON_ROUTE').map(match => (
                  <MatchCard
                    key={match.rideId}
                    match={match}
                    badgeType="dest"
                    getInitials={getInitials}
                    onSelect={() => { setSelectedMatch(match.rideId); setStep(3.5) }}
                  />
                ))}
              </div>
            )}

            {/* Type C — Source on route */}
            {matches.filter(m => m.matchType === 'SOURCE_ON_ROUTE').length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 pl-1">Type C — Pickup on route</p>
                {matches.filter(m => m.matchType === 'SOURCE_ON_ROUTE').map(match => (
                  <MatchCard
                    key={match.rideId}
                    match={match}
                    badgeType="source"
                    getInitials={getInitials}
                    onSelect={() => { setSelectedMatch(match.rideId); setStep(3.5) }}
                  />
                ))}
              </div>
            )}

            {/* No pool matches found */}
            {matches.length === 0 && (
              <div className="card-dark p-6 text-center mb-4">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white font-semibold mb-1">No pool matches found</p>
                <p className="text-gray-500 text-sm">No overlapping routes right now. Start a new pool or ride solo.</p>
              </div>
            )}

            {/* Start New Pool (when no matches) */}
            {matches.length === 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase mb-2 pl-1">Start a Pool</p>
                <button
                  onClick={() => { setSelectedMatch('NEW_POOL'); setStep(3.5) }}
                  className="w-full card-dark p-4 text-left border-dashed !border-primary/50 hover:!border-primary transition-all flex items-center gap-4"
                  style={{ borderStyle: 'dashed' }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 text-xl">
                    🤝
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">Start a New Pool</span>
                      <span className="text-primary font-bold text-lg">₹{Math.round((soloFare || calculatedSoloFare) * 0.65)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Be the first</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>Share the ride</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Solo — always last */}
            <div className="mt-4">
              <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 pl-1">Solo</p>
              <button
                onClick={() => { setSelectedMatch(null); setStep(3.5) }}
                className="w-full card-dark p-4 text-left border-dashed !border-gray-700 hover:!border-gray-500 transition-all flex items-center gap-4"
                style={{ borderStyle: 'dashed' }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 text-xl">
                  👤
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold">Ride Solo</span>
                    <span className="text-gray-300 font-bold text-lg">₹{calculatedSoloFare || soloFare}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>Direct route</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>No stops</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>Full price</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 3.5 — PRE-BOOKING REVIEW SUMMARY
        ═══════════════════════════════════════════════ */}
        {step === 3.5 && (
          <div className="animate-fade-in-up">
            <button onClick={() => setStep(3)} className="text-gray-500 text-sm mb-6 flex items-center gap-2 hover:text-white transition-colors">
              ← Back to matches
            </button>

            {/* Summary card */}
            <div className="card-dark overflow-hidden mb-4">

              {/* Header */}
              <div className="p-6 border-b border-[var(--border)]">
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-4">Review Your Booking</p>

                {/* Route */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm leading-tight">{from?.address?.split(',').slice(0,2).join(',')}</p>
                    <p className="text-gray-500 text-xs mb-3">{scheduleTime === 'Now' ? 'Pickup Now' : scheduleTime}</p>
                    <p className="text-white font-semibold text-sm leading-tight">{to?.address?.split(',').slice(0,2).join(',')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                      {selectedVehicle.icon} {selectedVehicle.label}
                    </span>
                  </div>
                </div>

                {/* Co-passenger block (pool only) */}
                {selectedMatch && selectedMatch !== 'NEW_POOL' && selectedMatchData && (
                  <div className="flex gap-3 items-center p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(selectedMatchData.passengerName)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">+ {anonymiseName(selectedMatchData.passengerName)}</p>
                      <p className="text-gray-500 text-xs">⭐ {selectedMatchData.passengerRating.toFixed(1)} · Co-passenger · {getMatchLabel(selectedMatchData.matchType)}</p>
                    </div>
                    {selectedMatchData.detourMinutes === 0 ? (
                      <span className="badge-no-detour">No detour</span>
                    ) : (
                      <span className="badge-detour">+{selectedMatchData.detourMinutes}m</span>
                    )}
                  </div>
                )}
                
                {selectedMatch === 'NEW_POOL' && (
                  <div className="flex gap-3 items-center p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      🤝
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">Starting a new pool</p>
                      <p className="text-gray-500 text-xs">A driver will be assigned to your route.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fare Breakdown */}
              <div className="p-6 border-b border-[var(--border)]">
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-3">Fare Breakdown</p>
                <div className="fare-row">
                  <span className="text-gray-400">Base fare</span>
                  <span className="text-white">₹{baseFare}</span>
                </div>
                {poolDiscount > 0 && (
                  <div className="fare-row">
                    <span className="text-emerald-500 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                      Pool discount
                    </span>
                    <span className="text-emerald-500 font-semibold">–₹{poolDiscount}</span>
                  </div>
                )}
                <div className="fare-row total">
                  <span className="text-white">Total</span>
                  <span className="text-primary text-xl">₹{finalFare}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">{distanceKm} km · ~{durationMin} min · {passengers} passenger{passengers > 1 ? 's' : ''}</p>
              </div>

              {/* Payment method */}
              <div
                className="p-5 border-b border-[var(--border)] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setPaymentMethod(paymentMethod === 'UPI' ? 'Card •••• 4242' : 'UPI')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-lg">💳</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{paymentMethod}</p>
                    <p className="text-gray-500 text-xs">Tap to change</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>

              {/* Cancellation policy */}
              <div className="p-5" style={{ background: 'rgba(239,68,68,0.04)' }}>
                <div className="flex gap-3 items-start">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-red-400/80 leading-relaxed">
                    <strong>Free cancel for 5 min after booking.</strong> Late cancellations incur a ₹50 penalty. Once the driver is within 500m, cancellation is not allowed.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              onClick={handleBookRide}
              disabled={booking}
              className="btn-primary w-full py-4 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/25"
            >
              {booking ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Confirming — dispatching driver…
                </span>
              ) : 'Confirm & Book → Driver dispatched instantly'}
            </button>
            <p className="text-center text-xs text-gray-600 mt-3">Payment via {paymentMethod} · Auto settled after ride</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 4 — BOOKED ANIMATION (brief then redirect)
        ═══════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ background: '#050505' }}>
            <div className="text-center animate-fade-in-up">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.05) 100%)', border: '2px solid rgba(16,185,129,0.4)', animation: 'driverBounce 1s ease-in-out infinite' }}>
                ✓
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Booked!</h2>
              <p className="text-gray-400 text-sm mb-2">Driver dispatch engine activated.</p>
              <p className="text-gray-600 text-xs">Redirecting to live tracking…</p>
              <div className="mt-6 w-48 h-1 rounded-full overflow-hidden mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full bg-primary rounded-full" style={{ animation: 'progressFill 1.5s linear reverse forwards' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  )
}

// ─── Match Card Sub-component ────────────────────────────────────────────────

interface MatchCardProps {
  match: PoolMatch
  badgeType: 'exact' | 'dest' | 'source'
  getInitials: (name: string | null) => string
  onSelect: () => void
}

function MatchCard({ match, badgeType, getInitials, onSelect }: MatchCardProps) {
  const detourBadge = () => {
    if (match.detourMinutes === 0) return <span className="badge-no-detour">No detour</span>
    return <span className="badge-detour">+{match.detourMinutes} min detour</span>
  }

  const typeBadge = () => {
    if (badgeType === 'exact') return <span className="badge-exact-match">Exact match</span>
    if (badgeType === 'dest') return <span className="badge-detour" style={{ color: '#818cf8', background: 'rgba(99,102,241,0.12)' }}>Dest on route</span>
    return <span className="badge-pickup-route">Pickup on route</span>
  }

  const discount = match.discount || Math.round(match.soloFare - match.poolFare)

  return (
    <button
      onClick={onSelect}
      className="w-full card-dark p-4 text-left mb-2 group transition-all duration-200"
      style={{ borderColor: 'var(--border)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 text-sm transition-all"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
          {getInitials(match.passengerName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-white font-bold text-sm">{match.passengerName || 'Co-passenger'}</span>
              <span className="text-gray-500 text-xs ml-2">⭐ {match.passengerRating.toFixed(1)}</span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-primary font-black text-lg leading-none">₹{match.poolFare}</p>
              {discount > 0 && <p className="text-gray-600 text-xs line-through">₹{match.soloFare}</p>}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {typeBadge()}
            {detourBadge()}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
              ETA ~{match.etaMinutes}m
            </span>
          </div>

          {/* Pickup/drop deltas */}
          {(match.pickupDiffKm !== undefined || match.dropDiffKm !== undefined) && (
            <div className="flex gap-3 text-[10px] text-gray-600">
              {match.pickupDiffKm !== undefined && <span>📍 Pickup +{match.pickupDiffKm}km</span>}
              {match.dropDiffKm !== undefined && <span>🏁 Drop +{match.dropDiffKm}km</span>}
            </div>
          )}
        </div>

        {/* Arrow */}
        <svg className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
