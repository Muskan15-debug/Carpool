'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlacesInput from '@/components/PlacesInput'
import Navbar from '@/components/Navbar'
import Map from '@/components/Map'

interface PlaceResult {
  address: string
  lat: number
  lng: number
}

export default function CreateRidePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState<PlaceResult | null>(null)
  const [to, setTo] = useState<PlaceResult | null>(null)
  const [form, setForm] = useState({
    departureTime: '',
    seatsAvailable: 1,
    price: 0,
    isRecurring: false,
    recurringDays: [] as string[]
  })

  const handleSubmit = async () => {
    if (!from || !to) return alert('Please select pickup and dropoff locations')
    if (!form.departureTime) return alert('Please select departure time')

    setLoading(true)
    const res = await fetch('/api/rides/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAddress: from.address,
        fromLat: from.lat,
        fromLng: from.lng,
        toAddress: to.address,
        toLat: to.lat,
        toLng: to.lng,
        ...form
      })
    })

    setLoading(false)
    if (res.ok) router.push('/rides')
    else alert('Something went wrong')
  }

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg" style={{ background: 'var(--primary-gradient)' }}>
              🚗
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Offer a Ride</h1>
              <p className="text-sm text-gray-400">Share your journey and earn money</p>
            </div>
          </div>

          <div className="mb-8">
            <Map from={from} to={to} height="200px" />
          </div>

          <div className="flex flex-col gap-5">
            {/* From */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Pickup Location
                </span>
              </label>
              <PlacesInput placeholder="e.g. Connaught Place, Delhi" onSelect={setFrom} enableCurrentLocation={true} />
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-light" />
                  Dropoff Location
                </span>
              </label>
              <PlacesInput placeholder="e.g. Sector 62, Noida" onSelect={setTo} />
            </div>

            {/* Departure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Departure Time</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                onChange={e => setForm({ ...form, departureTime: e.target.value })}
              />
            </div>

            {/* Seats + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Seats</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  defaultValue={1}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                  onChange={e => setForm({ ...form, seatsAvailable: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price / seat (₹)</label>
                <input
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm"
                  onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Recurring */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={e => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-medium text-gray-700">This is a recurring ride</span>
              </label>
              
              {form.isRecurring && (
                <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
                  {days.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        form.recurringDays.includes(day)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-primary-lighter hover:text-primary'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting Ride...
                </span>
              ) : (
                'Post Ride'
              )}
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-6 bg-primary-lighter rounded-xl p-4 flex gap-3 items-start">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-semibold text-primary mb-0.5">Pro Tip</p>
            <p className="text-xs text-primary/70">Setting a competitive price and offering recurring rides increases your chances of finding passengers by 3x!</p>
          </div>
        </div>
      </div>
    </main>
  )
}