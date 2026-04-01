import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

// GET /api/driver/rides - Fetch driver's rides categorized by status
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user?.role === 'PASSENGER') return NextResponse.json({ error: "Passengers cannot access driver endpoints." }, { status: 403 })


    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Active rides (IN_PROGRESS or DRIVER_ASSIGNED)
    const active = await prisma.ride.findMany({
      where: {
        driverId: user.id,
        status: { in: ['IN_PROGRESS', 'DRIVER_ASSIGNED'] },
      },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: { passenger: { select: { name: true, rating: true } } },
        },
      },
      orderBy: { departureTime: 'asc' },
    })

    // Pending booking requests on driver's rides
    const pendingBookings = await prisma.booking.findMany({
      where: {
        ride: { driverId: user.id },
        status: 'PENDING',
      },
      include: {
        passenger: { select: { name: true, rating: true, kycLevel: true } },
        ride: { select: { fromAddress: true, toAddress: true, distanceKm: true, vehicleType: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Completed rides today
    const completed = await prisma.ride.findMany({
      where: {
        driverId: user.id,
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: { passenger: { select: { name: true, rating: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Stats
    const allTodayRides = await prisma.ride.findMany({
      where: {
        driverId: user.id,
        createdAt: { gte: today },
      },
      include: {
        bookings: { where: { status: { not: 'CANCELLED' } } },
      },
    })

    const earnings = allTodayRides.reduce((sum, r) => 
      sum + r.bookings.reduce((bs, b) => bs + b.finalFare, 0), 0)
    
    const totalBookingsToday = await prisma.booking.count({
      where: { ride: { driverId: user.id }, createdAt: { gte: today } }
    })
    const acceptedToday = await prisma.booking.count({
      where: { ride: { driverId: user.id }, createdAt: { gte: today }, status: { in: ['CONFIRMED', 'BOARDED'] } }
    })

    return NextResponse.json({
      active,
      pending: pendingBookings,
      completed,
      stats: {
        earnings: Math.round(earnings),
        rides: completed.length,
        onlineHours: 4.2, // TODO: track actual online hours
        acceptRate: totalBookingsToday > 0 ? Math.round((acceptedToday / totalBookingsToday) * 100) : 100,
      },
    })
  } catch (err: any) {
    console.error("Driver rides error:", err)
    return NextResponse.json({ 
      active: [], 
      pending: [], 
      completed: [], 
      stats: { earnings: 0, rides: 0, onlineHours: 0, acceptRate: 0 } 
    })
  }
}
