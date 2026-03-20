'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlacesInput from '@/components/PlacesInput'
import Navbar from '@/components/Navbar'

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
    price: 0
  })

  const handleSubmit = async () => {
    if (!from || !to) return alert('Please select pickup and dropoff locations')

    setLoading(true)
    const res = await fetch('/api/rides', {
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

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Offer a Ride</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <PlacesInput placeholder="Pickup location" onSelect={setFrom} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <PlacesInput placeholder="Dropoff location" onSelect={setTo} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Departure Time</label>
            <input
              type="datetime-local"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              onChange={e => setForm({ ...form, departureTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Seats Available</label>
            <input
              type="number"
              min={1}
              max={6}
              defaultValue={1}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              onChange={e => setForm({ ...form, seatsAvailable: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price per seat (₹)</label>
            <input
              type="number"
              min={0}
              defaultValue={0}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 mt-4"
          >
            {loading ? 'Posting...' : 'Post Ride'}
          </button>
        </div>
      </div>
    </main>
  )
}