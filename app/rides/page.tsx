'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import PlacesInput from '@/components/PlacesInput'

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

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [filteredRides, setFilteredRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  // Input states
  const [fromLocationInput, setFromLocationInput] = useState<{ address: string, lat: number, lng: number } | null>(null)
  const [toLocationInput, setToLocationInput] = useState<{ address: string, lat: number, lng: number } | null>(null)
  const [maxPriceInput, setMaxPriceInput] = useState<number | ''>('')
  const [sortByInput, setSortByInput] = useState<'time' | 'price' | 'rating'>('time')

  // Applied states
  const [fromLocation, setFromLocation] = useState<{ address: string, lat: number, lng: number } | null>(null)
  const [toLocation, setToLocation] = useState<{ address: string, lat: number, lng: number } | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'time' | 'price' | 'rating'>('time')

  useEffect(() => {
    setLoading(true)
    let url = '/api/rides'
    if (fromLocation && toLocation) {
      url += `?originLat=${fromLocation.lat}&originLng=${fromLocation.lng}&destLat=${toLocation.lat}&destLng=${toLocation.lng}`
    } else if (fromLocation) {
      const cityStr = fromLocation.address.split(',')[0].trim()
      url += `?fromCity=${encodeURIComponent(cityStr)}`
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setRides(data)
        setFilteredRides(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [fromLocation, toLocation])

  // Apply filters function
  const applyFilters = () => {
    setFromLocation(fromLocationInput)
    setToLocation(toLocationInput)
    setMaxPrice(maxPriceInput)
    setSortBy(sortByInput)
  }

  const clearFilters = () => {
    setFromLocationInput(null)
    setToLocationInput(null)
    setMaxPriceInput('')
    setSortByInput('time')
    setFromLocation(null)
    setToLocation(null)
    setMaxPrice('')
    setSortBy('time')
  }

  useEffect(() => {
    let result = [...rides]

    // Price filter
    if (maxPrice !== '') {
      result = result.filter(r => r.price <= maxPrice)
    }

    // Sort
    if (sortBy === 'price') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.driver.rating - a.driver.rating)
    } else {
      result.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    }

    setFilteredRides(result)
  }, [maxPrice, sortBy, rides])

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Available Rides</h1>
              <p className="text-white/70 text-sm">{filteredRides.length} rides found</p>
            </div>
            <Link href="/rides/create" className="bg-white text-primary font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Offer a Ride
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <PlacesInput 
              placeholder="Pickup Location..." 
              onSelect={setFromLocationInput} 
              enableCurrentLocation={true}
            />
          </div>
          <div className="flex-1 relative">
            <PlacesInput 
              placeholder="Dropoff Location..." 
              onSelect={setToLocationInput} 
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max price ₹"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full sm:w-32 px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div>
            <select
              value={sortByInput}
              onChange={(e) => setSortByInput(e.target.value as any)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="time">Sort by Time</option>
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="bg-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm shrink-0"
            >
              Apply Filters
            </button>
            {(maxPriceInput !== '' || sortByInput !== 'time' || fromLocationInput !== null || toLocationInput !== null) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-primary hover:text-primary-dark font-medium px-2 py-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Finding rides for you...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRides.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛣️</div>
            <p className="text-gray-500 text-lg mb-2">No rides available</p>
            <p className="text-gray-400 text-sm mb-6">Be the first to offer a ride!</p>
            <Link href="/rides/create" className="btn-primary inline-block text-sm">
              Offer a Ride
            </Link>
          </div>
        )}

        {/* Ride Cards */}
        <div className="flex flex-col gap-4">
          {filteredRides.map((ride, index) => (
            <div 
              key={ride.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary-lighter" />
                      <div className="w-0.5 h-8 bg-primary/20" />
                      <div className="w-3 h-3 rounded-full bg-primary-light border-2 border-primary-lighter" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ride.fromAddress}</p>
                      <div className="h-4" />
                      <p className="font-semibold text-gray-900">{ride.toAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                  <div className="text-2xl font-bold text-primary">₹{ride.price}</div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full badge-active">
                    {ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? 's' : ''} left
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(ride.departureTime).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {ride.driver.rating} · {ride.driver.name}
                  </span>
                </div>
                <Link
                  href={`/rides/${ride.id}`}
                  className="text-primary font-semibold hover:text-primary-dark flex items-center gap-1 transition-colors mt-2 sm:mt-0"
                >
                  View & Book
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  )
}