'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  status: string
  otp: string
  ride: {
    status: string
    estimatedMinutes: number
    driver: {
      name: string
      rating: number
      vehiclePlate: string
      vehicleModel: string
    }
  }
}

export default function PassengerActiveRidePage() {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings/active')
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
        
        // If driver completes drop, status goes to COMPLETED
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
  }, [router])

  useEffect(() => { 
    fetchBooking() 
    const interval = setInterval(fetchBooking, 5000) // Poll for updates (simulate socket)
    return () => clearInterval(interval)
  }, [fetchBooking])

  if (loading || !booking) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>

  if (booking.status === 'COMPLETED') {
     router.push('/book/receipt')
     return null
  }

  const isBoarded = booking.status === 'BOARDED'

  return (
    <main className="min-h-screen relative bg-[#111] overflow-hidden">
       {/* Full-Screen Map Mocking Tracking */}
       <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1f2937 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          
          <div className="absolute top-1/2 left-1/2 -mt-20 transform -translate-x-1/2 -translate-y-1/2">
             <div className="w-16 h-16 bg-gradient-to-t from-primary/0 via-primary/20 to-primary rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)' }}>
                <div className="text-xl">🚗</div>
             </div>
          </div>
       </div>

       {/* Top Status */}
       <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 animate-fade-in-down">
          <div className="bg-[var(--surface)] text-white px-5 py-3 rounded-2xl border border-[var(--border)] shadow-2xl flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="font-bold text-sm leading-none">{isBoarded ? 'Heading to Drop-off' : 'Driver Arriving'}</p>
             </div>
          </div>
          <button className="bg-[var(--surface)] border border-[var(--border)] text-white w-12 h-12 rounded-full font-bold flex items-center justify-center shadow-2xl">
             🛡️
          </button>
       </div>

       <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center animate-pulse">
          <h1 className="text-5xl font-black text-white drop-shadow-2xl">{booking.ride.estimatedMinutes} <span className="text-2xl text-gray-300">min</span></h1>
       </div>

       {/* Bottom Tracking Card */}
       <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 animate-fade-in-up z-10">
          
          {/* OTP Banner */}
          {!isBoarded && booking.status === 'CONFIRMED' && (
             <div className="bg-primary text-black p-4 rounded-3xl mb-4 shadow-[0_10px_40px_rgba(16,185,129,0.4)] flex justify-between items-center px-6">
                <div>
                   <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Verify Ride</p>
                   <p className="font-bold leading-tight">Tell driver your PIN</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl">
                   <span className="text-3xl font-black tracking-widest">{booking.otp || '5121'}</span>
                </div>
             </div>
          )}

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
             <div className="flex gap-4 items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-light)] flex items-center justify-center text-3xl shrink-0 shadow-inner">
                   👨🏽‍✈️
                </div>
                <div className="flex-1">
                   <h4 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      {booking.ride.driver.name.split(' ')[0] || 'Driver'} 
                      <span className="text-sm bg-[var(--surface-light)] px-2 py-0.5 rounded-full">⭐ {booking.ride.driver.rating.toFixed(1)}</span>
                   </h4>
                   <p className="text-sm font-bold text-gray-400">
                      {booking.ride.driver.vehicleModel || 'White Toyota Etios'} • <span className="text-white px-2 py-0.5 bg-[var(--surface-light)] rounded">{booking.ride.driver.vehiclePlate || 'MH 04 AB 1234'}</span>
                   </p>
                </div>
             </div>

             <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] text-white font-bold hover:bg-white/10 transition-colors">
                   💬 Message
                </button>
                <button className="flex-1 py-4 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] text-white font-bold hover:bg-white/10 transition-colors">
                   📍 Share live info
                </button>
             </div>
             
             {!isBoarded && (
               <button className="w-full mt-4 py-3 text-red-500 font-bold text-sm tracking-wide active:opacity-50 transition-opacity">
                  CANCEL RIDE
               </button>
             )}
          </div>
       </div>
    </main>
  )
}
