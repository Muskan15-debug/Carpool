import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import Navbar from '@/components/Navbar'
import BookButton from '@/components/BookButton'
import { notFound } from 'next/navigation'
import Map from '@/components/Map'
import BookingActions from '@/components/BookingActions'
import VerifyOTP from '@/components/VerifyOTP'
import StartRideButton from '@/components/StartRideButton'
import EndRideButton from '@/components/EndRideButton'
import RideMapWithTracking from '@/components/RideMapWithTracking'

export default async function RidePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  const { id } = await params

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { driver: true, bookings: { include: { passenger: true } } }
  })

  if (!ride) return notFound()

  const user = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null

  const alreadyBooked = user
    ? ride.bookings.some(b => b.passengerId === user.id && b.status !== 'CANCELLED')
    : false

  const isDriver = user?.id === ride.driverId
  const confirmedPassengers = ride.bookings.filter(b => b.status !== 'CANCELLED')

  // Calculate approximate carbon savings (avg car: 120g CO₂/km, shared = divided)
  const estimatedKm = Math.round(
    Math.sqrt(
      Math.pow((ride.toLat - ride.fromLat) * 111, 2) + 
      Math.pow((ride.toLng - ride.fromLng) * 111 * Math.cos(ride.fromLat * Math.PI / 180), 2)
    )
  )
  const carbonSaved = ((estimatedKm * 120 * (confirmedPassengers.length)) / 1000).toFixed(1)

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Ride Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Ride Details</h1>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              ride.status === 'ACTIVE' ? 'badge-active' : 
              ride.status === 'IN_PROGRESS' ? 'badge-confirmed' :
              ride.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
              'badge-cancelled'
            }`}>
              {ride.status}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-start gap-3 mb-6">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-primary-lighter" />
              <div className="w-0.5 h-12 bg-primary/20" />
              <div className="w-3.5 h-3.5 rounded-full bg-primary-light border-2 border-primary-lighter" />
            </div>
            <div className="flex-1">
              <div>
                <p className="text-xs text-gray-400 font-medium">FROM</p>
                <p className="font-semibold text-gray-900">{ride.fromAddress}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs text-gray-400 font-medium">TO</p>
                <p className="font-semibold text-gray-900">{ride.toAddress}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Departure</p>
              <p className="font-semibold text-sm text-gray-900">{new Date(ride.departureTime).toLocaleDateString()}</p>
              <p className="text-xs text-primary font-medium">{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-xs text-gray-400 mb-1">Seats Left</p>
              <p className="font-bold text-2xl text-primary">{ride.seatsAvailable}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Price/Seat</p>
              <p className="font-bold text-2xl text-gray-900">₹{ride.price}</p>
            </div>
          </div>
        </div>

        {/* Route Map Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 animate-fade-in-up">
          {ride.status === 'IN_PROGRESS' ? (
            <RideMapWithTracking
              rideId={ride.id}
              isDriver={isDriver}
              from={{ address: ride.fromAddress, lat: ride.fromLat, lng: ride.fromLng }}
              to={{ address: ride.toAddress, lat: ride.toLat, lng: ride.toLng }}
              encodedPolyline={ride.polyline}
            />
          ) : (
            <Map 
              from={{ address: ride.fromAddress, lat: ride.fromLat, lng: ride.fromLng }}
              to={{ address: ride.toAddress, lat: ride.toLat, lng: ride.toLng }}
              encodedPolyline={ride.polyline}
              height="250px"
            />
          )}
        </div>

        {/* Driver Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-100">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Driver</h2>
          <div className="flex items-center gap-4">
            {ride.driver.avatar ? (
              <img src={ride.driver.avatar} className="w-14 h-14 rounded-full ring-2 ring-primary-lighter ring-offset-2" alt={ride.driver.name || 'Driver'} />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: 'var(--primary-gradient)' }}>
                {ride.driver.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{ride.driver.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span className="font-medium text-gray-700">{ride.driver.rating}</span>
                </span>
                {ride.driver.isDriver && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-lighter text-primary font-medium">Verified Driver</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Savings */}
        {estimatedKm > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 mb-6 border border-emerald-100 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌱</div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Carbon Savings</p>
                <p className="text-xs text-emerald-600">This ride saves approximately <strong>{carbonSaved} kg CO₂</strong> by sharing (~{estimatedKm}km trip)</p>
              </div>
            </div>
          </div>
        )}

        {/* Passengers */}
        {confirmedPassengers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-200">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Passengers ({confirmedPassengers.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {confirmedPassengers.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
                  {b.passenger.avatar ? (
                    <img src={b.passenger.avatar} className="w-7 h-7 rounded-full" alt={b.passenger.name || ''} />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary-lighter flex items-center justify-center text-xs font-bold text-primary">
                      {b.passenger.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{b.passenger.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'CONFIRMED' ? 'badge-confirmed' : 
                    b.status === 'BOARDED' ? 'bg-indigo-100 text-indigo-700 px-3' :
                    'badge-pending'
                  }`}>
                    {b.status}
                  </span>
                  
                  {!isDriver && b.passengerId === user?.id && b.otp && (
                    <span className="ml-auto px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-mono tracking-widest font-bold shadow-sm">
                      OTP: {b.otp}
                    </span>
                  )}
                  {isDriver && b.status === 'PENDING' && <BookingActions bookingId={b.id} status={b.status} />}
                  {isDriver && b.status === 'CONFIRMED' && <VerifyOTP bookingId={b.id} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Button */}
        <div className="animate-fade-in-up delay-300">
          {!isDriver && (
            <BookButton
              rideId={ride.id}
              alreadyBooked={alreadyBooked}
              noSeats={ride.seatsAvailable === 0}
              isLoggedIn={!!user}
            />
          )}

          {isDriver && (
            <>
              <div className="text-center py-4 px-6 rounded-2xl bg-primary-lighter mb-4">
                <p className="text-primary font-medium">🚗 This is your ride</p>
                <p className="text-xs text-primary/60 mt-1">You&apos;re the driver for this trip</p>
              </div>

              {ride.status === 'ACTIVE' && confirmedPassengers.length > 0 && (
                <StartRideButton rideId={ride.id} />
              )}
              
              {ride.status === 'IN_PROGRESS' && (
                <EndRideButton rideId={ride.id} />
              )}

              {ride.status === 'COMPLETED' && (
                <div className="text-center py-4 px-6 rounded-2xl bg-gray-100 text-gray-500 font-semibold mt-4">
                  🏁 This trip is complete.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}