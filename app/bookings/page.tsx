'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  status: string
  createdAt: string
  ride: {
    fromAddress: string
    toAddress: string
    departureTime: string
    price: number
    status: string
    driver: {
      name: string | null
      rating: number
      avatar: string | null
    }
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH' })
    if (res.ok) {
      setBookings(prev => prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      ))
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'badge-pending', text: 'text-yellow-600', label: 'Pending' },
    CONFIRMED: { bg: 'badge-confirmed', text: 'text-primary', label: 'Confirmed' },
    CANCELLED: { bg: 'badge-cancelled', text: 'text-red-500', label: 'Cancelled' },
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-1">My Bookings</h1>
          <p className="text-white/70 text-sm">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-primary/30 hover:text-primary'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
              {status !== 'all' && (
                <span className={`ml-1.5 text-xs ${filter === status ? 'text-white/70' : 'text-gray-400'}`}>
                  ({bookings.filter(b => b.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading your bookings...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 text-lg mb-2">No bookings found</p>
            <p className="text-gray-400 text-sm mb-6">
              {filter === 'all' ? 'Start by finding a ride!' : `No ${filter.toLowerCase()} bookings.`}
            </p>
            <button onClick={() => router.push('/rides')} className="btn-primary text-sm">
              Find Rides
            </button>
          </div>
        )}

        {/* Booking Cards */}
        <div className="flex flex-col gap-4">
          {filtered.map((booking, index) => {
            const config = statusConfig[booking.status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: booking.status }
            const isPast = new Date(booking.ride.departureTime) < new Date()
            
            return (
              <div 
                key={booking.id} 
                className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in-up ${isPast && booking.status !== 'CANCELLED' ? 'opacity-75' : ''}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    {/* Route */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary-lighter" />
                        <div className="w-0.5 h-8 bg-primary/20" />
                        <div className="w-3 h-3 rounded-full bg-primary-light border-2 border-primary-lighter" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{booking.ride.fromAddress}</p>
                        <div className="h-3" />
                        <p className="font-semibold text-gray-900 text-sm">{booking.ride.toAddress}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(booking.ride.departureTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {booking.ride.driver.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${config.bg}`}>
                      {config.label}
                    </span>
                    <p className="text-xl font-bold text-primary">₹{booking.ride.price}</p>
                  </div>
                </div>

                {/* Cancel Button */}
                {booking.status === 'PENDING' && !isPast && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="mt-4 w-full py-2.5 rounded-xl border-2 border-red-200 text-red-400 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    Cancel Booking
                  </button>
                )}

                {isPast && booking.status !== 'CANCELLED' && (
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    This ride has already departed
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
