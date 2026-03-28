'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Booking {
  id: string
  finalFare: number
  distanceKm: number
  ride: {
    driver: {
      id: string
      name: string
      avatar: string | null
    }
  }
}

export default function PassengerReceiptPage() {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const fetchReceipt = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings/receipt')
      if (res.ok) setBooking(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchReceipt() }, [fetchReceipt])

  const submitRating = async () => {
    setSubmitted(true)
    setTimeout(() => {
      router.push('/book')
    }, 1500)
    // Real implementation would POST rating to API
  }

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>
  if (!booking) return <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center items-center"><p className="text-white mb-4">No recent rides found.</p><button onClick={() => router.push('/book')} className="btn-primary px-6 py-2">Book a Ride</button></div>

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in-up">
        
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-4 border-emerald-500/20">
              ✔️
           </div>
           <h1 className="text-3xl font-black mb-1">Payment settled</h1>
           <p className="text-gray-400">Paid automatically via UPI</p>
        </div>

        <div className="bg-[var(--surface)] p-8 rounded-3xl border border-[var(--border)] mb-6 shadow-2xl relative overflow-hidden">
           {/* Receipt holes aesthetic */}
           <div className="absolute top-0 left-4 right-4 flex justify-between">
             <div className="w-3 h-3 rounded-full bg-[var(--background)] -mt-1.5 shadow-inner"></div>
             <div className="w-3 h-3 rounded-full bg-[var(--background)] -mt-1.5 shadow-inner"></div>
             <div className="w-3 h-3 rounded-full bg-[var(--background)] -mt-1.5 shadow-inner"></div>
           </div>

           <div className="text-center mb-6 pb-6 border-b border-dashed border-gray-600">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Total Fare</h2>
             <div className="text-5xl font-black text-primary mb-1">₹{booking.finalFare}</div>
             <div className="text-xs text-gray-500">Including all taxes and pool discounts</div>
           </div>

           {!submitted ? (
             <div className="text-center">
               <h3 className="text-sm font-bold text-white mb-4">How was {booking.ride.driver.name.split(' ')[0]}'s driving?</h3>
               <div className="flex justify-center gap-2 flex-row-reverse mb-6">
                 {[5,4,3,2,1].map(star => (
                   <button 
                     key={star} 
                     onClick={() => setRating(star)}
                     className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-500' : 'text-gray-600'}`}
                   >
                     ★
                   </button>
                 ))}
               </div>
               <button 
                 onClick={submitRating}
                 disabled={rating === 0}
                 className="w-full py-4 rounded-xl font-bold bg-primary text-black disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400"
               >
                 Submit Rating
               </button>
             </div>
           ) : (
             <div className="text-center py-6 text-emerald-500 font-bold">
               Thanks for your feedback! Redirecting...
             </div>
           )}
        </div>

        <button onClick={() => router.push('/book')} className="w-full py-4 bg-[var(--surface-light)] rounded-xl text-gray-400 hover:text-white transition-colors uppercase text-sm tracking-widest font-bold">
           BOOK AGAIN
        </button>
      </div>
    </main>
  )
}
