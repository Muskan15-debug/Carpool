import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import Navbar from '@/components/Navbar'
import BookButton from '@/components/BookButton'
import { notFound } from 'next/navigation'

export default async function RidePage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  const ride = await prisma.ride.findUnique({
    where: { id: params.id },
    include: { driver: true, bookings: true }
  })

  if (!ride) return notFound()

  const user = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null

  const alreadyBooked = user
    ? ride.bookings.some(b => b.passengerId === user.id && b.status !== 'CANCELLED')
    : false

  const isDriver = user?.id === ride.driverId

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Ride Details */}
        <div className="border rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Ride Details</h1>
          <div className="flex flex-col gap-3 text-gray-700">
            <div>
              <p className="text-sm text-gray-400">From</p>
              <p className="font-medium">{ride.fromAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">To</p>
              <p className="font-medium">{ride.toAddress}</p>
            </div>
            <div className="flex gap-8 mt-2">
              <div>
                <p className="text-sm text-gray-400">Departure</p>
                <p className="font-medium">{new Date(ride.departureTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Seats Available</p>
                <p className="font-medium">{ride.seatsAvailable}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="font-medium">₹{ride.price}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Details */}
        <div className="border rounded-xl p-6 mb-6 flex items-center gap-4">
          {ride.driver.avatar && (
            <img src={ride.driver.avatar} className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="font-semibold">{ride.driver.name}</p>
            <p className="text-sm text-gray-400">⭐ {ride.driver.rating} rating</p>
          </div>
        </div>

        {/* Book Button */}
        {!isDriver && (
          <BookButton
            rideId={ride.id}
            alreadyBooked={alreadyBooked}
            noSeats={ride.seatsAvailable === 0}
            isLoggedIn={!!user}
          />
        )}

        {isDriver && (
          <p className="text-center text-gray-400">This is your ride</p>
        )}
      </div>
    </main>
  )
}