'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Ride {
  id: string
  fromAddress: string
  toAddress: string
  departureTime: string
  seatsAvailable: number
  price: number
  status: string
  driver: {
    name: string | null
    rating: number
    avatar: string | null
  }
}

export default function DashboardCityRides({ initialCity }: { initialCity: string | null }) {
  const [cityInput, setCityInput] = useState(initialCity || '')
  const [appliedCity, setAppliedCity] = useState(initialCity || '')
  
  const [rides, setRides] = useState<Ride[]>([])
  const [filteredRides, setFilteredRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [savingCity, setSavingCity] = useState(false)

  // Filter Inputs
  const [maxPriceInput, setMaxPriceInput] = useState<number | ''>('')
  const [minSeatsInput, setMinSeatsInput] = useState<number | ''>('')
  const [dateInput, setDateInput] = useState<string>('')

  // Applied Filters
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [minSeats, setMinSeats] = useState<number | ''>('')
  const [selectedDate, setSelectedDate] = useState<string>('')

  const applyFilters = () => {
    setMaxPrice(maxPriceInput)
    setMinSeats(minSeatsInput)
    setSelectedDate(dateInput)
  }

  const clearFilters = () => {
    setMaxPriceInput('')
    setMinSeatsInput('')
    setDateInput('')
    setMaxPrice('')
    setMinSeats('')
    setSelectedDate('')
  }

  // Fetch rides when appliedCity changes
  useEffect(() => {
    if (!appliedCity) {
      setRides([])
      setFilteredRides([])
      return
    }

    setLoading(true)
    fetch(`/api/rides?fromCity=${encodeURIComponent(appliedCity)}`)
      .then(res => res.json())
      .then(data => {
        setRides(data)
        setFilteredRides(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [appliedCity])

  // Apply filters
  useEffect(() => {
    let result = [...rides]

    if (maxPrice !== '') {
      result = result.filter(r => r.price <= maxPrice)
    }

    if (minSeats !== '') {
      result = result.filter(r => r.seatsAvailable >= minSeats)
    }

    if (selectedDate !== '') {
      const filterDate = new Date(selectedDate).toDateString()
      result = result.filter(r => new Date(r.departureTime).toDateString() === filterDate)
    }

    setFilteredRides(result)
  }, [maxPrice, minSeats, selectedDate, rides])

  const handleCitySave = async () => {
    if (!cityInput) return
    setSavingCity(true)
    setAppliedCity(cityInput) // Update applied city to trigger fetch
    try {
      await fetch('/api/user/city', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityInput })
      })
    } catch (err) {
      console.error('Failed to save city', err)
    } finally {
      setSavingCity(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCitySave()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-500 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-gray-900 text-xl">Available Rides in Your City</h2>
          <p className="text-gray-500 text-sm">Find rides departing from your city instantly</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Enter your city..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button 
            onClick={handleCitySave}
            disabled={savingCity || !cityInput}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
          >
            {savingCity ? 'Saving...' : 'Set City'}
          </button>
        </div>
      </div>

      {appliedCity && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="text-sm font-medium text-gray-700 w-full sm:w-auto">Filters:</div>
          <input
            type="number"
            placeholder="Max price ₹"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value ? parseInt(e.target.value) : '')}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full sm:w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            placeholder="Min seats"
            value={minSeatsInput}
            onChange={(e) => setMinSeatsInput(e.target.value ? parseInt(e.target.value) : '')}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full sm:w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button 
            onClick={applyFilters}
            className="text-white bg-primary hover:bg-primary-dark transition-colors px-4 py-2 rounded-lg text-sm font-medium"
          >
            Apply Filters
          </button>
          {(maxPriceInput !== '' || minSeatsInput !== '' || dateInput !== '') && (
            <button 
              onClick={clearFilters}
              className="text-xs text-primary hover:text-primary-dark font-medium px-2 py-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Finding rides in {appliedCity}...</p>
        </div>
      ) : !appliedCity ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="text-3xl mb-2">🏙️</div>
          <p className="text-gray-500 text-sm mb-1">Set your city to see local rides</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-gray-500 text-sm mb-1">No rides found in {appliedCity} matching your filters</p>
          <Link href="/rides/create" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
            Offer the first ride →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRides.map(ride => (
            <div key={ride.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lighter/50 flex items-center justify-center text-primary font-bold text-sm">
                    {ride.driver.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{ride.driver.name}</p>
                    <div className="flex items-center text-[10px] text-gray-500">
                      <span className="text-yellow-400 mr-0.5">★</span> {ride.driver.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">₹{ride.price}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full badge-active mt-1 inline-block">
                    {ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? 's' : ''} left
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-3 mt-4">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="w-0.5 h-6 bg-primary/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate" title={ride.fromAddress}>{ride.fromAddress}</p>
                  <p className="text-xs font-medium text-gray-900 truncate mt-3" title={ride.toAddress}>{ride.toAddress}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(ride.departureTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <Link href={`/rides/${ride.id}`} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors bg-primary-lighter/30 px-3 py-1.5 rounded-lg">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
