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
    <button disabled className="w-full py-3 rounded-lg bg-gray-100 text-gray-400 font-medium">
      No Seats Available
    </button>
  )

  if (alreadyBooked) return (
    <button disabled className="w-full py-3 rounded-lg bg-green-100 text-green-600 font-medium">
      ✅ Already Booked
    </button>
  )

  return (
    <button
      onClick={handleBook}
      disabled={loading}
      className="w-full py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? 'Booking...' : 'Book This Ride'}
    </button>
  )
}