'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'

interface Passenger {
  name: string
}

interface Booking {
  id: string
  finalFare: number
  passenger: Passenger
}

interface DriverReceipt {
  id: string
  baseFare: number
  bookings: Booking[]
}

export default function DriverReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [receipt, setReceipt] = useState<DriverReceipt | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReceipt = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/ride/${resolvedParams.id}`)
      if (res.ok) setReceipt(await res.json())
    } catch {}
    setLoading(false)
  }, [resolvedParams.id])

  useEffect(() => { fetchReceipt() }, [fetchReceipt])

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>
  if (!receipt) return <div className="min-h-screen bg-[var(--background)] grid place-items-center"><button onClick={() => router.push('/driver')} className="btn-primary px-6 py-2">Go to Dashboard</button></div>

  const totalEarnings = receipt.bookings.reduce((sum, b) => sum + b.finalFare, 0)

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in-up">
        
        <div className="text-center mb-8 pt-8">
           <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-4 border-blue-500/20">
              🎉
           </div>
           <h1 className="text-3xl font-black mb-1">Ride Complete</h1>
           <p className="text-gray-400">Great job getting everyone safely.</p>
        </div>

        <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] mb-6 shadow-2xl">
           <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center mb-4">Total Earnings</h2>
           <div className="text-6xl font-black text-center text-white mb-6">₹{totalEarnings}</div>
           
           <div className="space-y-4 border-t border-[var(--border)] pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payout Details</h3>
              {receipt.bookings.map(book => (
                 <div key={book.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{book.passenger.name}</span>
                    <span className="font-bold">₹{book.finalFare}</span>
                 </div>
              ))}
           </div>
        </div>

        <button onClick={() => router.push('/driver')} className="w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-400 active:scale-95 transition-all mb-4">
           RETURN TO DASHBOARD
        </button>
      </div>
    </main>
  )
}
