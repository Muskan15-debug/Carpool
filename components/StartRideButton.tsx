'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StartRideButton({ rideId }: { rideId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    const res = await fetch(`/api/rides/${rideId}/start`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to start ride')
    }
  }

  return (
    <button 
      onClick={handleStart}
      disabled={loading}
      className="btn-primary w-full py-4 text-lg mt-4 animate-fade-in-up"
    >
      {loading ? 'Starting...' : '🚀 Start Ride Now'}
    </button>
  )
}
