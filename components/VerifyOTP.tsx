'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyOTP({ bookingId }: { bookingId: string }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async () => {
    if (otp.length !== 4) return alert('OTP must be 4 digits')
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Verification failed')
    }
  }

  return (
    <div className="flex items-center gap-2 ml-auto">
      <input 
        type="text"
        maxLength={4}
        placeholder="OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-center tracking-widest font-mono"
      />
      <button 
        onClick={handleVerify}
        disabled={loading || otp.length !== 4}
        className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        Verify
      </button>
    </div>
  )
}
