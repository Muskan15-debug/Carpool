'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface CoPassenger {
  id: string
  name: string | null
  rating: number
}

interface Receipt {
  id: string
  finalFare: number
  poolDiscount: number
  matchType: string
  createdAt: string
  ride: {
    fromAddress: string
    toAddress: string
    distanceKm: number
    estimatedMinutes: number
    vehicleType: string
    driver: {
      id: string
      name: string | null
      avatar: string | null
      rating: number
      vehicleModel: string | null
      vehiclePlate: string | null
    }
    coPassengers: CoPassenger[]
  }
}

const VEHICLE_ICONS: Record<string, string> = {
  AUTO: '🛺', MINI_CAB: '🚗', SEDAN: '🚙', SUV: '🚐'
}

export default function PassengerReceiptPage() {
  const router = useRouter()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverRating, setDriverRating] = useState(0)
  const [driverComment, setDriverComment] = useState('')
  const [coPassengerVotes, setCoPassengerVotes] = useState<Record<string, 'up' | 'down' | null>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showReceiptDetail, setShowReceiptDetail] = useState(false)

  const fetchReceipt = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings/receipt')
      if (res.ok) {
        const data = await res.json()
        setReceipt(data)
        // Init co-passenger votes
        const votes: Record<string, null> = {}
        data.ride?.coPassengers?.forEach((cp: CoPassenger) => { votes[cp.id] = null })
        setCoPassengerVotes(votes)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchReceipt() }, [fetchReceipt])

  const submitRating = async () => {
    setSubmitted(true)
    // In production: POST rating + co-passenger votes to API
    setTimeout(() => router.push('/book'), 2000)
  }

  const anonymiseName = (name: string | null) => {
    if (!name) return 'Co-passenger'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1][0]}.`
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const rideDate = receipt ? new Date(receipt.createdAt).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Loading receipt…</p>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center items-center px-6">
        <p className="text-5xl mb-4">🧾</p>
        <p className="text-white font-bold text-lg mb-2">No recent rides</p>
        <p className="text-gray-500 text-sm mb-6">Complete a ride to see your receipt here.</p>
        <button onClick={() => router.push('/book')} className="btn-primary px-8 py-3">Book a Ride</button>
      </div>
    )
  }

  const isPool = receipt.ride.coPassengers?.length > 0
  const baseFare = receipt.finalFare + receipt.poolDiscount

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in-up">

        {/* ── Auto-payment settled header ── */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-4"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
            ✔️
          </div>
          <h1 className="text-3xl font-black mb-1">Payment settled</h1>
          <p className="text-gray-400 text-sm">Charged automatically · No action needed</p>
          <p className="text-xs text-gray-600 mt-1">{rideDate}</p>
        </div>

        {/* ── Receipt ticket card ── */}
        <div className="receipt-ticket mb-5 shadow-2xl">

          {/* Fare total */}
          <div className="p-6 text-center border-b border-dashed border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Fare</p>
            <div className="text-5xl font-black text-primary mb-1">₹{receipt.finalFare}</div>
            {isPool && receipt.poolDiscount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                🎉 You saved ₹{receipt.poolDiscount} with pool
              </div>
            )}
          </div>

          {/* Route */}
          <div className="p-5 border-b border-dashed border-[var(--border)]">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold leading-tight mb-1">{receipt.ride.fromAddress?.split(',').slice(0,2).join(',')}</p>
                <p className="text-gray-500 text-xs mb-3">Pickup</p>
                <p className="text-white text-sm font-semibold leading-tight mb-1">{receipt.ride.toAddress?.split(',').slice(0,2).join(',')}</p>
                <p className="text-gray-500 text-xs">Drop-off</p>
              </div>
              <div className="text-right text-2xl">
                {VEHICLE_ICONS[receipt.ride.vehicleType] || '🚗'}
              </div>
            </div>
          </div>

          {/* Trip details */}
          <div className="p-5 border-b border-dashed border-[var(--border)]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Distance</p>
                <p className="text-white font-bold">{receipt.ride.distanceKm?.toFixed(1) || '—'} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-white font-bold">{receipt.ride.estimatedMinutes || '—'} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-white font-bold">{isPool ? 'Pool' : 'Solo'}</p>
              </div>
            </div>
          </div>

          {/* Fare breakdown toggle */}
          <button
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            onClick={() => setShowReceiptDetail(!showReceiptDetail)}
          >
            <span className="text-sm font-semibold text-gray-300">Fare breakdown</span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${showReceiptDetail ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showReceiptDetail && (
            <div className="px-5 pb-5 animate-fade-in">
              <div className="fare-row">
                <span className="text-gray-400">Base fare</span>
                <span className="text-white">₹{baseFare}</span>
              </div>
              {receipt.poolDiscount > 0 && (
                <div className="fare-row">
                  <span className="text-emerald-500">Pool discount</span>
                  <span className="text-emerald-500">–₹{receipt.poolDiscount}</span>
                </div>
              )}
              <div className="fare-row">
                <span className="text-gray-400">Platform fee</span>
                <span className="text-white">₹0</span>
              </div>
              <div className="fare-row total">
                <span className="text-white">Total paid</span>
                <span className="text-primary">₹{receipt.finalFare}</span>
              </div>
            </div>
          )}

          {/* Co-passengers (if pool) */}
          {isPool && receipt.ride.coPassengers.length > 0 && (
            <div className="p-5 border-t border-dashed border-[var(--border)]">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Co-passengers</p>
              {receipt.ride.coPassengers.map(cp => (
                <div key={cp.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>
                    {getInitials(cp.name)}
                  </div>
                  <span className="text-white text-sm font-medium">{anonymiseName(cp.name)}</span>
                  <span className="text-gray-500 text-xs">⭐ {cp.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Rate your experience ── */}
        {!submitted ? (
          <div className="card-dark p-6 mb-4">
            {/* Driver rating */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-1">
                How was {receipt.ride.driver.name?.split(' ')[0] || 'your driver'}?
              </h3>
              <p className="text-gray-500 text-xs mb-4">Rate your driver 1–5 stars</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setDriverRating(star)}
                    className="text-4xl transition-all hover:scale-110 active:scale-95"
                    style={{ color: driverRating >= star ? '#F59E0B' : 'rgba(255,255,255,0.1)' }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {driverRating > 0 && (
                <textarea
                  value={driverComment}
                  onChange={e => setDriverComment(e.target.value)}
                  placeholder="Optional comment for the driver…"
                  className="w-full mt-4 p-3 rounded-xl text-sm text-white resize-none"
                  style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', height: '72px' }}
                />
              )}
            </div>

            {/* Co-passenger thumbs (pool only) */}
            {isPool && receipt.ride.coPassengers.length > 0 && (
              <div className="mb-5 border-t border-[var(--border)] pt-5">
                <p className="text-sm font-bold text-white mb-3">Rate co-passenger(s)</p>
                <div className="space-y-3">
                  {receipt.ride.coPassengers.map(cp => (
                    <div key={cp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
                          {getInitials(cp.name)}
                        </div>
                        <span className="text-white text-sm">{anonymiseName(cp.name)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCoPassengerVotes(prev => ({ ...prev, [cp.id]: prev[cp.id] === 'up' ? null : 'up' }))}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all"
                          style={{
                            background: coPassengerVotes[cp.id] === 'up' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${coPassengerVotes[cp.id] === 'up' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            transform: coPassengerVotes[cp.id] === 'up' ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          👍
                        </button>
                        <button
                          onClick={() => setCoPassengerVotes(prev => ({ ...prev, [cp.id]: prev[cp.id] === 'down' ? null : 'down' }))}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all"
                          style={{
                            background: coPassengerVotes[cp.id] === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${coPassengerVotes[cp.id] === 'down' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            transform: coPassengerVotes[cp.id] === 'down' ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={submitRating}
              disabled={driverRating === 0}
              className="w-full py-4 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: driverRating > 0 ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.08)', color: driverRating > 0 ? 'white' : '#6b7280' }}
            >
              {driverRating === 0 ? 'Tap a star to rate' : 'Submit Rating →'}
            </button>
          </div>
        ) : (
          <div className="card-dark p-8 text-center mb-4 animate-fade-in">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-primary font-black text-xl mb-1">Thanks for your feedback!</p>
            <p className="text-gray-500 text-sm">Redirecting to book again…</p>
          </div>
        )}

        {/* ── Book again shortcut ── */}
        <button
          onClick={() => router.push(`/book?from=${encodeURIComponent(receipt.ride.fromAddress)}&to=${encodeURIComponent(receipt.ride.toAddress)}`)}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
        >
          🔁 Book again — same route
        </button>
      </div>
    </main>
  )
}
