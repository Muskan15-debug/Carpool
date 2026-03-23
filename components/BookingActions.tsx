'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingActions({ bookingId, status }: { bookingId: string, status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'CONFIRM' | 'DECLINE') => {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Something went wrong')
    }
  }

  if (status !== 'PENDING') return null

  return (
    <div className="flex gap-2 ml-auto pl-4">
      <button 
        disabled={loading}
        onClick={() => handleAction('CONFIRM')} 
        className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
      >
        Accept
      </button>
      <button 
        disabled={loading}
        onClick={() => handleAction('DECLINE')} 
        className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  )
}
