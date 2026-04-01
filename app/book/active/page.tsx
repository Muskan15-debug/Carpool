'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  status: string
  otp: string
  matchType?: string
  ride: {
    id: string
    status: string
    estimatedMinutes: number
    fromAddress: string
    toAddress: string
    distanceKm?: number
    driver: {
      name: string
      rating: number
      vehiclePlate: string
      vehicleModel: string
      currentLat?: number
      currentLng?: number
    }
  }
}

// Pool stop pins (mock co-passengers for pool rides)
const MOCK_POOL_STOPS = [
  { id: 'stop-1', label: 'Rahul\'s pickup', color: '#A855F7', top: '38%', left: '42%' },
  { id: 'stop-2', label: 'Priya\'s drop', color: '#FF6B6B', top: '62%', left: '61%' },
]

export default function PassengerActiveRidePage() {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)
  const [showSosModal, setShowSosModal] = useState(false)
  const [sosActivated, setSosActivated] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [deviationAlert, setDeviationAlert] = useState(false)
  const [driverPos, setDriverPos] = useState({ x: 0, y: 0 })
  const animFrameRef = useRef<number | null>(null)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings/active')
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
        if (etaMinutes === null) {
          setEtaMinutes(data.ride.estimatedMinutes || 4)
        }
        if (data.status === 'COMPLETED') {
          router.push('/book/receipt')
        }
      } else {
        router.push('/')
      }
    } catch {
      router.push('/')
    }
    setLoading(false)
  }, [router, etaMinutes])

  useEffect(() => {
    fetchBooking()
    const interval = setInterval(fetchBooking, 6000)
    return () => clearInterval(interval)
  }, [fetchBooking])

  // Decrement ETA every 30s
  useEffect(() => {
    if (etaMinutes === null || etaMinutes <= 0) return
    const t = setTimeout(() => setEtaMinutes(prev => (prev && prev > 0 ? prev - 1 : 0)), 30000)
    return () => clearTimeout(t)
  }, [etaMinutes])

  // Animate driver dot
  useEffect(() => {
    let t = 0
    const animate = () => {
      t += 0.005
      setDriverPos({
        x: Math.sin(t * 1.3) * 18,
        y: Math.cos(t) * 14,
      })
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [])

  // Simulate route deviation alert after 20s
  useEffect(() => {
    const t = setTimeout(() => setDeviationAlert(true), 20000)
    return () => clearTimeout(t)
  }, [])

  const activateSOS = () => {
    setSosActivated(true)
    setShowSosModal(false)
    // In production: POST to /api/sos with live location + emergency contacts
  }

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Connecting to ride…</p>
      </div>
    )
  }

  if (booking.status === 'COMPLETED') {
    router.push('/book/receipt')
    return null
  }

  const isBoarded = booking.status === 'BOARDED'
  const isPool = booking.matchType === 'EXACT' || booking.matchType === 'DEST_ON_ROUTE' || booking.matchType === 'SOURCE_ON_ROUTE'
  const driverFirstName = booking.ride.driver.name?.split(' ')[0] || 'Driver'

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: '#080808' }}>

      {/* ── Full-screen animated map ── */}
      <div className="absolute inset-0">
        {/* Grid dots background */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        {/* Gradient overlay at edges */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,8,8,0.7) 100%)'
        }} />

        {/* Route SVG line */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
          <path
            d="M 20% 75% Q 40% 50% 50% 50% T 80% 28%"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="8 4"
            style={{ animation: 'routeTraceDash 3s ease forwards' }}
          />
        </svg>

        {/* Pickup pin */}
        <div className="absolute" style={{ bottom: '26%', left: '20%', transform: 'translateX(-50%)' }}>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg shadow-primary/50" />
            <div className="text-[9px] text-primary font-bold mt-1 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
              Your pickup
            </div>
          </div>
        </div>

        {/* Drop pin */}
        <div className="absolute" style={{ top: '25%', right: '22%', transform: 'translateX(50%)' }}>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg shadow-red-500/50" />
            <div className="text-[9px] text-red-400 font-bold mt-1 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
              Your drop
            </div>
          </div>
        </div>

        {/* Pool stop pins */}
        {isPool && MOCK_POOL_STOPS.map(stop => (
          <div
            key={stop.id}
            className="pool-pin"
            style={{ top: stop.top, left: stop.left, background: stop.color }}
            title={stop.label}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: stop.color }}>
              {stop.label}
            </div>
          </div>
        ))}

        {/* Driver animated dot */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '48%',
            transform: `translate(calc(-50% + ${driverPos.x}px), calc(-50% + ${driverPos.y}px))`,
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 w-12 h-12 rounded-full border border-primary animate-ping opacity-30"
            style={{ top: '-6px', left: '-6px', width: '48px', height: '48px' }} />
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-2xl shadow-primary/60 border-2 border-primary"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <span className="text-base">🚗</span>
          </div>
          <div className="text-[8px] font-black text-primary mt-1 text-center whitespace-nowrap"
            style={{ textShadow: '0 0 8px rgba(16,185,129,0.8)' }}>
            {driverFirstName}
          </div>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-20">
        {/* Status pill */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl"
          style={{ background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Status</p>
            <p className="font-bold text-sm text-white leading-none">
              {isBoarded ? '🚗 En route to drop-off' : `🚕 ${driverFirstName} is on the way`}
            </p>
          </div>
        </div>

        {/* SOS button */}
        <button
          className="sos-btn"
          style={{ position: 'relative', top: 'unset', right: 'unset', zIndex: 'unset' }}
          onClick={() => setShowSosModal(true)}
        >
          {sosActivated ? '🚨' : 'SOS'}
        </button>
      </div>

      {/* ── Deviation alert banner ── */}
      {deviationAlert && (
        <div className="absolute top-20 left-4 right-4 z-20 deviation-banner p-3 flex items-center justify-between animate-slide-in-down">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚠️</span>
            <p className="text-amber-400 text-xs font-semibold">Driver deviated &gt;500m from route</p>
          </div>
          <button
            className="text-xs font-bold text-amber-400 underline"
            onClick={() => setDeviationAlert(false)}
          >
            Alert contact
          </button>
        </div>
      )}

      {/* ── Large ETA ── */}
      <div className="absolute z-10" style={{ top: '30%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
          {isBoarded ? 'Arrives at drop-off in' : 'Driver arrives in'}
        </p>
        <h1 className="font-black text-white leading-none" style={{ fontSize: 'clamp(3rem, 12vw, 5rem)', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
          {etaMinutes ?? '--'}
          <span className="text-2xl text-gray-400 ml-1">min</span>
        </h1>
      </div>

      {/* ── OTP Banner ── */}
      {!isBoarded && booking.status === 'CONFIRMED' && (
        <div className="absolute z-20 left-4 right-4 animate-fade-in-up"
          style={{ bottom: '340px' }}>
          <div className="flex justify-between items-center px-6 py-4 rounded-2xl shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' }}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">Boarding PIN — share with driver</p>
              <p className="text-sm font-semibold opacity-90">Tell {driverFirstName} your 4-digit code</p>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/30">
              <span className="text-3xl font-black tracking-[6px] text-white">{booking.otp || '5121'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Driver bottom sheet ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 driver-sheet p-5 pb-8">

        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

        {/* Driver info row */}
        <div className="flex gap-4 items-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            👨🏽‍✈️
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xl font-black text-white">{driverFirstName}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                ⭐ {booking.ride.driver.rating.toFixed(1)}
              </span>
              {isPool && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                  Pool
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{booking.ride.driver.vehicleModel || 'Toyota Etios'}</span>
              <span className="text-gray-600">·</span>
              <span className="text-sm font-bold text-white px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                {booking.ride.driver.vehiclePlate || 'MH 04 AB 1234'}
              </span>
            </div>
          </div>
        </div>

        {/* Route summary if boarded */}
        {isBoarded && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-primary">●</span>
            <span className="text-gray-500 truncate">{booking.ride.fromAddress}</span>
            <span className="text-gray-600 shrink-0">→</span>
            <span className="text-red-400 truncate">{booking.ride.toAddress}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            💬 Message
          </button>
          <button className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            📍 Share location
          </button>
        </div>

        {/* Cancel */}
        {!isBoarded && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2.5 text-red-500/70 font-semibold text-sm hover:text-red-400 transition-colors text-center"
          >
            Cancel ride
          </button>
        )}
      </div>

      {/* ── SOS Modal ── */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm animate-slide-in-up" style={{ background: '#111', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px', padding: '28px' }}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🚨</div>
              <h3 className="text-xl font-black text-white mb-2">Emergency SOS</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                This will immediately alert your emergency contacts and share your live location with them and local authorities.
              </p>
            </div>
            <button
              onClick={activateSOS}
              className="w-full py-4 rounded-2xl font-black text-white text-lg mb-3"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.5)' }}
            >
              🚨 Activate SOS Now
            </button>
            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-3 text-gray-500 font-semibold text-sm"
            >
              Cancel — I'm safe
            </button>
          </div>
        </div>
      )}

      {/* SOS Activated banner */}
      {sosActivated && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in-down p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.95)', border: '1px solid rgba(239,68,68,0.5)' }}>
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-white font-black text-sm">SOS Activated</p>
            <p className="text-red-200 text-xs">Emergency contacts notified · Live location shared</p>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm animate-fade-in-up" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '28px' }}>
            <h3 className="text-xl font-black text-white mb-3">Cancel this ride?</h3>
            <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-400 text-sm leading-relaxed">
                ⚠️ <strong>Cancellation penalty:</strong> If your driver has already been dispatched for more than 5 minutes, a ₹50 cancellation fee applies.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Keep ride
              </button>
              <button
                className="flex-1 py-3.5 rounded-xl font-bold text-red-400 text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                Cancel anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
