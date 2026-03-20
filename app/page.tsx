import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <h1 className="text-5xl font-bold mb-4">
          Share Rides, <span className="text-green-500">Save Money</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-8">
          Find people travelling your way. Book a seat or offer a ride in minutes.
        </p>
        <div className="flex gap-4">
          <Link
            href="/rides"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800"
          >
            Find a Ride
          </Link>
          <Link
            href="/rides/create"
            className="border border-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
          >
            Offer a Ride
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-16 bg-gray-50">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🚗</div>
          <h3 className="font-bold text-xl mb-2">Find Rides</h3>
          <p className="text-gray-500">Search rides going your way and book a seat instantly.</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="font-bold text-xl mb-2">Save Money</h3>
          <p className="text-gray-500">Split fuel costs with fellow passengers.</p>
        </div>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="font-bold text-xl mb-2">Trusted Community</h3>
          <p className="text-gray-500">Ratings and reviews keep the community safe.</p>
        </div>
      </section>
    </main>
  )
}