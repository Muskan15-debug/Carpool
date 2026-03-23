import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    const clerkUser = await clerk.users.getUser(userId)
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
        name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "Unknown User",
        avatar: clerkUser.imageUrl,
      }
    })
  }

  // Fetch user stats
  const [ridesCreated, totalBookings, activeRides, upcomingBookings] = await Promise.all([
    prisma.ride.count({ where: { driverId: user.id } }),
    prisma.booking.count({ where: { passengerId: user.id } }),
    prisma.ride.findMany({ 
      where: { driverId: user.id, status: 'ACTIVE' }, 
      include: { bookings: true },
      orderBy: { departureTime: 'asc' },
      take: 3
    }),
    prisma.booking.findMany({
      where: { 
        passengerId: user.id, 
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: { departureTime: { gte: new Date() } }
      },
      include: { ride: { include: { driver: true } } },
      orderBy: { ride: { departureTime: 'asc' } },
      take: 3
    })
  ])

  // Carbon savings estimate (simplified: avg 15km per ride, 120g CO₂/km saved by sharing)
  const totalRidesTaken = totalBookings
  const carbonSaved = ((totalRidesTaken * 15 * 120) / 1000).toFixed(1)
  const moneySaved = (totalRidesTaken * 85).toFixed(0) // avg ₹85 saved per shared ride

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Welcome Header */}
      <div className="relative overflow-hidden" style={{ background: 'var(--primary-gradient)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-white/20 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} className="w-14 h-14 rounded-full ring-2 ring-white/30 ring-offset-2 ring-offset-primary" alt={user.name || 'User'} />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {user.name?.split(' ')[0] || 'there'}! 👋</h1>
              <p className="text-white/70 text-sm">Here&apos;s your ride sharing activity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Rides Created', value: ridesCreated, icon: '🚗', color: 'from-violet-500 to-purple-600' },
            { label: 'Rides Taken', value: totalBookings, icon: '🎫', color: 'from-blue-500 to-indigo-600' },
            { label: 'CO₂ Saved', value: `${carbonSaved}kg`, icon: '🌱', color: 'from-emerald-500 to-teal-600' },
            { label: 'Money Saved', value: `₹${moneySaved}`, icon: '💰', color: 'from-amber-500 to-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-10`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Upcoming Rides</h2>
              <Link href="/bookings" className="text-primary text-sm font-medium hover:text-primary-dark transition-colors">
                View all →
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-sm">No upcoming rides</p>
                <Link href="/rides" className="text-primary text-sm font-medium mt-2 inline-block hover:text-primary-dark">
                  Find a ride →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-xl bg-gray-50 hover:bg-primary-lighter/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <div className="w-0.5 h-5 bg-primary/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{booking.ride.fromAddress}</p>
                        <p className="text-sm font-medium text-gray-900 truncate mt-2">{booking.ride.toAddress}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">₹{booking.ride.price}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(booking.ride.departureTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Rides (Driver) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Your Active Rides</h2>
              <Link href="/rides/create" className="text-primary text-sm font-medium hover:text-primary-dark transition-colors">
                + New ride
              </Link>
            </div>

            {activeRides.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🚗</div>
                <p className="text-gray-400 text-sm">No active rides</p>
                <Link href="/rides/create" className="text-primary text-sm font-medium mt-2 inline-block hover:text-primary-dark">
                  Offer a ride →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeRides.map((ride) => (
                  <Link key={ride.id} href={`/rides/${ride.id}`} className="p-4 rounded-xl bg-gray-50 hover:bg-primary-lighter/30 transition-colors block">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ride.fromAddress}</p>
                        <p className="text-xs text-gray-400 mt-0.5">→ {ride.toAddress}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full badge-active">
                          {ride.bookings.filter(b => b.status !== 'CANCELLED').length} passenger{ride.bookings.filter(b => b.status !== 'CANCELLED').length !== 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {new Date(ride.departureTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up delay-400">
          <Link href="/rides" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-primary-lighter group-hover:scale-110 transition-transform">
              🔍
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Find a Ride</p>
              <p className="text-xs text-gray-400">Search available rides</p>
            </div>
          </Link>
          <Link href="/rides/create" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-primary-lighter group-hover:scale-110 transition-transform">
              ➕
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Offer a Ride</p>
              <p className="text-xs text-gray-400">Share your next trip</p>
            </div>
          </Link>
          <Link href="/bookings" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-primary-lighter group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">My Bookings</p>
              <p className="text-xs text-gray-400">View all your trips</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
