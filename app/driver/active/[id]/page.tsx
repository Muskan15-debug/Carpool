'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'

interface Passenger {
  name: string
  rating: number
}

interface Booking {
  id: string
  status: string
  finalFare: number
  passenger: Passenger
  // Added fields to match schema
  otp?: string | null 
}

interface ActiveRide {
  id: string
  status: string
  distanceKm: number
  bookings: Booking[]
}

interface Waypoint {
  type: 'PICKUP' | 'DROP'
  bookingId: string
  name: string
  status: string // PENDING, COMPLETED
}

export default function ActiveNavigationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [ride, setRide] = useState<ActiveRide | null>(null)
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [loading, setLoading] = useState(true)

  // OTP Modal State
  const [showOtp, setShowOtp] = useState(false)
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchRide = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/ride/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setRide(data)

        // Generate Waypoints
        // A simple heuristic for MVP: All Pickups that are not cancelled/boarded/completed first.
        // Then all Drops that are currently boarded.
        const wps: Waypoint[] = []

        data.bookings.forEach((b: Booking) => {
          if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
             wps.push({ type: 'PICKUP', bookingId: b.id, name: b.passenger.name, status: 'PENDING' })
          } else if (b.status === 'BOARDED') {
             wps.push({ type: 'DROP', bookingId: b.id, name: b.passenger.name, status: 'PENDING' })
          }
        })
        
        setWaypoints(wps)
      } else {
        router.push('/driver')
      }
    } catch {
      router.push('/driver')
    }
    setLoading(false)
  }, [resolvedParams.id, router])

  useEffect(() => { fetchRide() }, [fetchRide])

  const handleAction = async (wp: Waypoint) => {
    if (wp.type === 'PICKUP') {
      setCurrentBookingId(wp.bookingId)
      setShowOtp(true)
    } else {
      // Complete DROP
      setProcessing(true)
      const res = await fetch('/api/driver/complete-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: wp.bookingId })
      })
      const data = await res.json()
      setProcessing(false)
      if (data.rideEnded) {
         router.push('/driver/receipt/' + resolvedParams.id)
      } else {
         fetchRide()
      }
    }
  }

  const verifyOtp = async () => {
    if (otpInput.length !== 4) return
    setProcessing(true)
    const res = await fetch('/api/driver/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: currentBookingId, otp: otpInput })
    })
    
    setProcessing(false)
    if (res.ok) {
      setShowOtp(false)
      setOtpInput('')
      fetchRide()
    } else {
      const data = await res.json()
      alert(data.error || 'Invalid OTP')
    }
  }

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>

  if (!waypoints.length) {
     return (
        <div className="min-h-screen bg-[var(--background)] p-6 text-center flex flex-col justify-center">
           <h2 className="text-white text-2xl font-bold mb-2">No active waypoints</h2>
           <p className="text-gray-500 mb-8">All passengers have been dropped off.</p>
           <button onClick={() => router.push('/driver')} className="btn-primary py-3">Return to Dashboard</button>
        </div>
     )
  }

  const activeWaypoint = waypoints[0] // The next stop

  return (
    <main className="min-h-screen relative bg-[#111] overflow-hidden">
       {/* Full-Screen Map Mocking Turn-by-Turn */}
       <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1f2937 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          {/* Navigation Polyline Mock */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
             <path d="M 50,200 Q 150,100 200,300 T 300,400" fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
             <path d="M 50,200 Q 150,100 200,300 T 300,400" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <div className="absolute top-1/2 left-1/2 -mt-10 transform -translate-x-1/2 -translate-y-1/2">
             <div className="w-16 h-16 bg-gradient-to-t from-blue-500/0 via-blue-500/20 to-blue-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)' }}>
                <div className="w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
             </div>
          </div>
       </div>

       {/* Top Status Bar */}
       <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
          <div className="bg-emerald-500 text-black px-4 py-3 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.5)]">
             ↑ 250m
          </div>
          <button className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">
             SOS
          </button>
       </div>

       {/* Bottom Waypoint Manager Panel */}
       <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 animate-fade-in-up">
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl backdrop-blur-lg">
             {/* Passenger Count Indicator */}
             <div className="absolute -top-4 right-6 bg-black border border-[var(--border)] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                👥 {ride?.bookings.filter(b => b.status === 'BOARDED').length} / {ride?.bookings.length} on board
             </div>

             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Current Stop</h3>
             
             <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-inner ${activeWaypoint.type === 'PICKUP' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                   {activeWaypoint.type === 'PICKUP' ? '📍' : '🏁'}
                </div>
                <div className="flex-1">
                   <h4 className="text-2xl font-bold text-white mb-1">
                      {activeWaypoint.type === 'PICKUP' ? 'Pick up' : 'Drop off'} {activeWaypoint.name}
                   </h4>
                   <p className="text-sm font-medium text-gray-400">
                      {waypoints.length - 1} stops remaining
                   </p>
                </div>
             </div>
             
             <button 
                onClick={() => handleAction(activeWaypoint)}
                disabled={processing}
                className={`w-full py-5 rounded-2xl font-black text-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all active:scale-95 text-black tracking-wide ${activeWaypoint.type === 'PICKUP' ? 'bg-primary hover:bg-emerald-400' : 'bg-blue-500 hover:bg-blue-400'}`}
             >
                {processing ? 'Processing...' : activeWaypoint.type === 'PICKUP' ? 'I HAVE ARRIVED (ENTER OTP)' : 'PASSENGER DROPPED OFF'}
             </button>
          </div>
       </div>

       {/* OTP Modal Overlay */}
       {showOtp && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center p-4">
             <div className="bg-[var(--surface)] w-full max-w-sm mx-auto rounded-3xl p-6 border border-[var(--border)] shadow-2xl animate-fade-in-up">
                <div className="text-center mb-6">
                   <div className="w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center text-3xl mb-4">🔐</div>
                   <h3 className="text-xl font-bold text-white mb-2">Verify Passenger</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">Ask the passenger for their 4-digit PIN to confirm they are the correct person.</p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                   <input 
                      type="text" 
                      maxLength={4}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-full text-center text-4xl font-bold tracking-[0.5em] bg-[var(--surface-light)] border border-[var(--border)] rounded-2xl py-4 text-white placeholder-gray-600 focus:border-primary focus:outline-none transition-colors"
                      autoFocus
                   />
                </div>

                <div className="flex gap-3">
                   <button onClick={() => { setShowOtp(false); setOtpInput(''); }} className="flex-1 py-4 font-bold text-gray-400 rounded-xl bg-[var(--surface-light)] hover:text-white transition-colors">
                      Cancel
                   </button>
                   <button 
                      onClick={verifyOtp} 
                      disabled={otpInput.length !== 4 || processing}
                      className="flex-1 py-4 font-bold text-black rounded-xl bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      Confirm Entry
                   </button>
                </div>
             </div>
          </div>
       )}
    </main>
  )
}
