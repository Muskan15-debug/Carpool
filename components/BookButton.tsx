'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  rideId: string
  alreadyBooked: boolean
  noSeats: boolean
  isLoggedIn: boolean
}

export default function BookButton({ rideId, alreadyBooked, noSeats, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleBook = async () => {
    if (!isLoggedIn) return router.push('/sign-in')

    setLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId })
    })

    setLoading(false)

    if (res.ok) {
      router.push('/bookings')
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Something went wrong')
    }
  }

  if (noSeats) return (
    <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-not-allowed">
      No Seats Available
    </button>
  )

  if (alreadyBooked) return (
    <button disabled className="w-full py-3.5 rounded-xl bg-primary-lighter text-primary font-semibold text-sm cursor-default flex items-center justify-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      Already Booked
    </button>
  )

  return (
    <button
      onClick={handleBook}
      disabled={loading}
      className="btn-primary w-full py-3.5 text-base"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Booking...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Book This Ride
        </span>
      )}
    </button>
  )
}