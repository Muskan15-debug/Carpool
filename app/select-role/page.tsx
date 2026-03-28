'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SelectRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'PASSENGER' | 'DRIVER' | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: 'MINI_CAB',
    vehiclePlate: '',
    vehicleModel: '',
  })

  const handleContinue = async () => {
    if (!selectedRole) return
    setLoading(true)

    const body: any = { role: selectedRole }
    if (selectedRole === 'DRIVER') {
      body.vehicleType = vehicleForm.vehicleType
      body.vehiclePlate = vehicleForm.vehiclePlate
      body.vehicleModel = vehicleForm.vehicleModel
    }

    const res = await fetch('/api/user/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (res.ok) {
      router.push(selectedRole === 'DRIVER' ? '/driver' : '/book')
    } else {
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg w-full animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--primary-gradient)' }}>
              R
            </div>
            <span className="text-2xl font-bold text-white">RideShare</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">How will you use RideShare?</h1>
          <p className="text-gray-500">Choose your role to get started</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedRole('PASSENGER')}
            className={`p-6 rounded-2xl text-left transition-all ${
              selectedRole === 'PASSENGER'
                ? 'border-2 border-primary bg-primary/5'
                : 'border-2 border-[var(--border)] hover:border-[var(--border-light)]'
            }`}
            style={{ background: selectedRole === 'PASSENGER' ? 'rgba(16,185,129,0.08)' : 'var(--surface)' }}
          >
            <div className="text-4xl mb-3">🧳</div>
            <h3 className="text-lg font-bold text-white mb-1">Passenger</h3>
            <p className="text-sm text-gray-500">Book rides, share with others & save money</p>
          </button>

          <button
            onClick={() => setSelectedRole('DRIVER')}
            className={`p-6 rounded-2xl text-left transition-all ${
              selectedRole === 'DRIVER'
                ? 'border-2 border-primary bg-primary/5'
                : 'border-2 border-[var(--border)] hover:border-[var(--border-light)]'
            }`}
            style={{ background: selectedRole === 'DRIVER' ? 'rgba(16,185,129,0.08)' : 'var(--surface)' }}
          >
            <div className="text-4xl mb-3">🚗</div>
            <h3 className="text-lg font-bold text-white mb-1">Driver</h3>
            <p className="text-sm text-gray-500">Go online, accept rides & earn money</p>
          </button>
        </div>

        {/* Driver Vehicle Form */}
        {selectedRole === 'DRIVER' && (
          <div className="card-dark p-5 mb-6 animate-fade-in space-y-4">
            <h3 className="font-semibold text-white text-sm">Vehicle Details</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vehicle Type</label>
              <select
                value={vehicleForm.vehicleType}
                onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
              >
                <option value="AUTO">Auto Rickshaw</option>
                <option value="MINI_CAB">Mini Cab</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. MH 01 AB 1234"
                value={vehicleForm.vehiclePlate}
                onChange={e => setVehicleForm({ ...vehicleForm, vehiclePlate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vehicle Model</label>
              <input
                type="text"
                placeholder="e.g. Maruti Swift"
                value={vehicleForm.vehicleModel}
                onChange={e => setVehicleForm({ ...vehicleForm, vehicleModel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--surface-light)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="btn-primary w-full py-4 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Setting up...
            </span>
          ) : (
            `Continue as ${selectedRole === 'DRIVER' ? 'Driver' : selectedRole === 'PASSENGER' ? 'Passenger' : '...'}`
          )}
        </button>
      </div>
    </main>
  )
}
