'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => { setBookings(data); setLoading(false) })
  }, [])

  const handleCancel = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH' })
    if (res.ok) {
      setBookings(prev => prev.map((b: any) =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      ))
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {loading && <p className="text-gray-400">Loading...</p>}

        {!loading && bookings.length === 0 && (
          <p className="text-gray-400 text-center py-20">No bookings yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="border rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{booking.ride.fromAddress}</p>
                  <p className="text-gray-400 text-sm">↓</p>
                  <p className="font-semibold">{booking.ride.toAddress}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(booking.ride.departureTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-500' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {booking.status}
                  </span>
                  <p className="text-lg font-bold mt-2">₹{booking.ride.price}</p>
                </div>
              </div>

              {booking.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="mt-4 w-full border border-red-400 text-red-400 py-2 rounded-lg hover:bg-red-50"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
