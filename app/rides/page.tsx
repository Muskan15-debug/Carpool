import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function RidesPage() {
  const rides = await prisma.ride.findMany({
    where: { status: 'ACTIVE' },
    include: { driver: true },
    orderBy: { departureTime: 'asc' }
  })

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Available Rides</h1>
          <Link
            href="/rides/create"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            + Offer a Ride
          </Link>
        </div>

        {rides.length === 0 && (
          <p className="text-gray-500 text-center py-20">No rides available yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {rides.map(ride => (
            <div key={ride.id} className="border rounded-xl p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{ride.fromAddress}</p>
                  <p className="text-gray-400 text-sm">↓</p>
                  <p className="font-semibold text-lg">{ride.toAddress}</p>
                </div>
                <p className="text-2xl font-bold">₹{ride.price}</p>
              </div>

              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>🕐 {new Date(ride.departureTime).toLocaleString()}</span>
                <span>💺 {ride.seatsAvailable} seats</span>
                <span>⭐ {ride.driver.rating} · {ride.driver.name}</span>
              </div>

              <Link
                href={`/rides/${ride.id}`}
                className="block text-center mt-4 border border-black py-2 rounded-lg hover:bg-black hover:text-white transition"
              >
                View & Book
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}