'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface UserProfile {
  id: string
  name: string
  kycStatus: string
  isOnline: boolean
  vehicleType: string
  vehicleModel: string
  vehiclePlate: string
  rating: number
}

interface BookingRequest {
  id: string
  rideId: string
  matchType: string
  finalFare: number
  status: string
  passenger: {
    name: string
    rating: number
    kycLevel: number
  }
  ride: {
    fromAddress: string
    toAddress: string
    distanceKm: number
    vehicleType: string
  }
}

interface ActiveRide {
  id: string
  fromAddress: string
  toAddress: string
  status: string
  distanceKm: number
  estimatedMinutes: number
  bookings: {
    id: string
    status: string
    matchType: string
    finalFare: number
    passenger: {
      name: string
      rating: number
    }
  }[]
}

export default function DriverDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<BookingRequest[]>([])
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([])
  const [completedRides, setCompletedRides] = useState<ActiveRide[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ earnings: 0, rides: 0, onlineHours: 0, acceptRate: 0 })
  const [dispatchTimer, setDispatchTimer] = useState(15)

  const fetchData = useCallback(async () => {
    try {
      const userRes = await fetch('/api/user/me')
      const userData = await userRes.json()
      
      // Verification check
      if (userData.kycStatus === 'UNVERIFIED' || userData.kycStatus === 'PENDING') {
        router.push('/driver/verify')
        return
      }

      setUser(userData)
      setIsOnline(userData.isOnline || false)

      const ridesRes = await fetch('/api/driver/rides')
      const ridesData = await ridesRes.json()
      
      if (ridesData.active) setActiveRides(ridesData.active)
      if (ridesData.pending) {
        // Reset timer only if new request came in
        if (ridesData.pending.length > 0 && pendingRequests.length === 0) {
          setDispatchTimer(15)
        }
        setPendingRequests(ridesData.pending)
      }
      if (ridesData.completed) setCompletedRides(ridesData.completed)
      if (ridesData.stats) setStats(ridesData.stats)
    } catch (err) {
      console.error('Failed to fetch driver data:', err)
    }
    setLoading(false)
  }, [router, pendingRequests.length])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll for new requests every 10 seconds when online
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [isOnline, fetchData])

  // Dispatch Timer countdown logic
  useEffect(() => {
    if (pendingRequests.length > 0 && dispatchTimer > 0) {
      const timer = setTimeout(() => {
        setDispatchTimer(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (pendingRequests.length > 0 && dispatchTimer <= 0) {
      // Time expired, auto-decline
      handleDecline(pendingRequests[0].id)
    }
  }, [dispatchTimer, pendingRequests])

  const toggleOnline = async () => {
    const endpoint = isOnline ? '/api/driver/go-offline' : '/api/driver/go-online'
    const body: any = {}
    
    if (!isOnline && navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        body.lat = pos.coords.latitude
        body.lng = pos.coords.longitude
      } catch {}
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    if (res.ok) {
      setIsOnline(!isOnline)
    }
  }

  const handleAccept = async (bookingId: string) => {
    const res = await fetch('/api/driver/accept-ride', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    if (res.ok) fetchData()
  }

  const handleDecline = async (bookingId: string) => {
    const res = await fetch('/api/driver/decline-ride', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    if (res.ok) {
      setPendingRequests(prev => prev.filter(p => p.id !== bookingId))
      setDispatchTimer(15) // Reset for next
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Full Screen 15s Dispatch Takeover */}
        {pendingRequests.length > 0 && (
          <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col p-4 sm:p-6 animate-fade-in-up">
            <div className="flex-1 rounded-2xl overflow-hidden relative border border-[var(--border)] mb-4 shadow-2xl">
              {/* Map Mock Background */}
              <div className="absolute inset-0 bg-[#0f0f0f]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1f2937 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>
              <div className="absolute inset-x-8 inset-y-16 border-2 border-dashed border-primary/40 rounded-full pointer-events-none"></div>
              
              <div className="absolute top-6 left-6 right-6 flex justify-between">
                <div className="bg-black/90 backdrop-blur px-5 py-3 rounded-2xl border border-[var(--border)] shadow-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Payout</p>
                  <p className="text-4xl font-black text-primary">₹{pendingRequests[0].finalFare}</p>
                </div>
                <div className="bg-black/90 backdrop-blur w-16 h-16 rounded-full border border-[var(--border)] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                   <span className="text-2xl font-black text-white tabular-nums">{dispatchTimer}</span>
                </div>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 text-center">
                 <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border border-primary/30 uppercase">
                    {pendingRequests[0].matchType === 'EXACT' ? 'Exact Match Route' : 'Pickup On Route'}
                 </span>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 mb-4 shadow-2xl">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Incoming Pool Request</h3>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-2xl font-black shadow-inner">
                  {getInitials(pendingRequests[0].passenger.name)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-2xl font-bold text-white flex items-center gap-3 truncate">
                    {pendingRequests[0].passenger.name}
                    {pendingRequests[0].passenger.kycLevel >= 1 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-wider">Verified</span>}
                  </h4>
                  <p className="text-sm text-yellow-500 mb-2 font-medium">⭐ {pendingRequests[0].passenger.rating.toFixed(1)} Rating</p>
                  <p className="text-sm text-gray-400 truncate">
                    {pendingRequests[0].ride.fromAddress.split(',')[0]} → {pendingRequests[0].ride.toAddress.split(',')[0]}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={() => handleDecline(pendingRequests[0].id)} className="flex-1 py-5 rounded-2xl border border-[var(--border)] text-gray-400 font-bold hover:bg-[var(--surface-light)] hover:text-white transition-colors active:scale-95 uppercase tracking-wide text-sm">
                Decline
              </button>
              <button onClick={() => handleAccept(pendingRequests[0].id)} className="flex-[2] py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all active:scale-95 tracking-wide">
                ACCEPT RIDE
              </button>
            </div>
            
            <div className="h-1.5 bg-[var(--surface-light)] rounded-full overflow-hidden mx-2 mb-2">
               <div className="h-full bg-primary transition-all ease-linear" style={{ width: `${(dispatchTimer / 15) * 100}%` }}></div>
            </div>
          </div>
        )}

        {/* Dashboard Content (hidden during dispatch takeover) */}
        <div className={`transition-opacity duration-300 ${pendingRequests.length > 0 ? 'opacity-0 pointer-events-none fixed inset-0' : 'opacity-100'}`}>
          
          {/* Header with online toggle */}
          <div className="card-dark p-6 mb-6">
            <div className="flex items-center justify-between hover:bg-[var(--surface-light)] p-2 -m-2 rounded-xl transition-colors cursor-pointer" onClick={toggleOnline}>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {greeting()}, {user?.name?.split(' ')[0] || 'Driver'}
                </h1>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-primary shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`}></div>
                   <p className="text-sm text-gray-400">
                     {isOnline ? 'Online • Taking requests' : 'Offline'}
                   </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`toggle-switch ${isOnline ? 'active' : ''}`}
                  role="switch"
                  aria-checked={isOnline}
                />
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {stats.acceptRate < 80 && stats.rides > 5 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 text-xl">⚠️</div>
                <div>
                  <p className="text-sm font-bold text-white">Low Acceptance Rate</p>
                  <p className="text-xs text-red-400/80">Keep rate above 80% to maintain Priority tier.</p>
                </div>
              </div>
            )}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 items-center">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 text-xl">💸</div>
               <div>
                  <p className="text-sm font-bold text-white">Next Payout: Tomorrow</p>
                  <p className="text-xs text-blue-400/80">₹{stats.earnings.toLocaleString()} will be deposited.</p>
               </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="card-dark p-4 text-center">
              <p className="text-white font-black text-xl mb-1">₹{stats.earnings.toLocaleString()}</p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Today</p>
            </div>
            <div className="card-dark p-4 text-center">
              <p className="text-white font-black text-xl mb-1">{stats.rides}</p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Rides</p>
            </div>
            <div className="card-dark p-4 text-center">
              <p className="text-white font-black text-xl mb-1">{stats.onlineHours.toFixed(1)}<span className="text-sm text-gray-500">h</span></p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Online</p>
            </div>
            <div className="card-dark p-4 text-center">
              <p className={`font-black text-xl mb-1 ${stats.acceptRate >= 80 ? 'text-primary' : 'text-yellow-500'}`}>{stats.acceptRate}%</p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Accept</p>
            </div>
          </div>

          {/* Map view / Heatmap when online but idle */}
          {isOnline && activeRides.length === 0 && (
            <div className="relative rounded-3xl overflow-hidden aspect-[16/9] mb-6 border border-[var(--border)] shadow-2xl">
               <div className="absolute inset-0 bg-[#0c0c0c]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1f2937 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
               
               {/* Faked Heatmap Demand Zones */}
               <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-amber-500/10 blur-[40px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
               <div className="absolute top-2/3 right-1/4 w-48 h-48 bg-red-500/10 blur-[50px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }}></div>
               <div className="absolute bottom-1/4 left-1/2 w-32 h-32 bg-primary/10 blur-[30px] rounded-full mix-blend-screen"></div>

               <div className="absolute top-4 left-4">
                  <span className="bg-black/60 backdrop-blur pb-1 pt-1.5 px-3 rounded text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/10">Demand Map</span>
               </div>
               
               {/* Driver location dot */}
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-5 h-5 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] border-2 border-white"></div>
                  <div className="absolute -inset-6 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute -inset-10 border border-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
               </div>
            </div>
          )}

          {/* Active Rides List (fallback to basic cards if Phase 4 full-nav isn't active yet) */}
          {activeRides.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[10px] font-bold tracking-widest text-gray-500 mb-3 uppercase">Current Mission</h2>
              {activeRides.map(ride => (
                <div key={ride.id} className="bg-[var(--surface)] p-5 rounded-2xl border-l-[6px] border-l-primary shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-bold text-lg leading-tight mb-1">
                        {ride.fromAddress.split(',')[0]} <span className="text-gray-500">→</span> {ride.toAddress.split(',')[0]}
                      </p>
                      <p className="text-gray-400 text-xs">
                         {ride.distanceKm} km · Est. {ride.estimatedMinutes} mins
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 uppercase">
                      In Progress
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {ride.bookings.filter(b => b.status !== 'CANCELLED').map(booking => (
                      <div key={booking.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm font-bold">
                            {getInitials(booking.passenger.name)}
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{booking.passenger.name}</p>
                            <p className="text-primary text-xs font-bold">₹{booking.finalFare}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${booking.status === 'BOARDED' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {booking.status === 'BOARDED' ? 'On board' : 'Awaiting Pickup'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button className="btn-primary flex-1 py-3 text-sm font-bold">
                      Launch Navigator ↗
                    </button>
                    <button className="px-5 py-3 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                      SOS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly Earnings Chart */}
          <div className="card-dark p-6 mb-6">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Weekly Earnings Snapshot</h2>
              <span className="text-sm font-bold text-white">₹{stats.earnings + 2450}</span>
            </div>
            <div className="h-32 flex items-end justify-between gap-1 sm:gap-2">
              {[450, 800, 350, 1200, 900, 600, Math.max(stats.earnings, 100)].map((val, i) => (
                <div key={i} className="w-full flex flex-col items-center justify-end gap-2 group">
                  <div className="w-full relative flex justify-center">
                    <span className="absolute -top-6 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">₹{val}</span>
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-700 ${i === 6 ? 'bg-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[var(--surface-light)] hover:bg-gray-600'}`} 
                      style={{ height: `${(val / 1500) * 100}%`, minHeight: '4px' }} 
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${i === 6 ? 'text-primary' : 'text-gray-500'}`}>
                    {['M','T','W','T','F','S','S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  )
}
