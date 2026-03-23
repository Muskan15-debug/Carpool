'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EndRideButton({ rideId }: { rideId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEnd = async () => {
    if (!confirm('Are you certain you want to end this trip?')) return

    setLoading(true)
    const res = await fetch(`/api/rides/${rideId}/end`, { method: 'POST' })
    setLoading(false)
    
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to end ride')
    }
  }

  return (
    <button 
      onClick={handleEnd}
      disabled={loading}
      className="w-full py-4 text-lg mt-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg animate-fade-in-up"
    >
      {loading ? 'Adding up miles...' : '🏁 End Ride'}
    </button>
  )
}
