import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getRouteInfo } from '@/lib/fareEngine'

// GET - fetch current user's bookings
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bookings = await prisma.booking.findMany({
    where: { passengerId: user.id },
    include: { ride: { include: { driver: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(bookings)
}

// POST - book a ride
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rideId, solo, matchType, finalFare, poolDiscount, route } = body
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (solo && route) {
    // 1. Find an available driver online with the correct vehicle type
    const driver = await prisma.user.findFirst({
      where: {
        role: 'DRIVER',
        isOnline: true,
        vehicleType: route.vehicleType,
      }
    })

    if (!driver) {
      return NextResponse.json({ error: 'No drivers available right now. Please try again later.' }, { status: 404 })
    }

    // 2. Create the Ride for that driver
    const departureTime = new Date()
    departureTime.setMinutes(departureTime.getMinutes() + 5) // ETA 5 mins

    // create ride + booking using nested create
    const booking = await prisma.booking.create({
      data: {
        passenger: { connect: { id: user.id } },
        status: 'PENDING',
        matchType: 'EXACT',
        finalFare: finalFare || 0,
        poolDiscount: 0,
        otp: String(Math.floor(1000 + Math.random() * 9000)),
        ride: {
          create: {
            driver: { connect: { id: driver.id } },
            fromAddress: route.fromAddress,
            fromLat: route.fromLat,
            fromLng: route.fromLng,
            toAddress: route.toAddress,
            toLat: route.toLat,
            toLng: route.toLng,
            vehicleType: route.vehicleType,
            distanceKm: route.distanceKm,
            estimatedMinutes: route.estimatedMinutes,
            departureTime,
            seatsAvailable: 3, // 4 max minus 1 for this booking
            price: finalFare || 0,
            status: 'SEARCHING'
          }
        }
      }
    })

    // 3. Get Mapbox polyline and create PostGIS routeGeom for matching engine
    const routeInfo = await getRouteInfo(route.fromLat, route.fromLng, route.toLat, route.toLng)
    if (routeInfo.polyline) {
      // Must use raw SQL for Unsupported PostGIS types
      await prisma.$executeRaw`
        UPDATE "Ride"
        SET 
          polyline = ${routeInfo.polyline},
          "originGeom" = ST_SetSRID(ST_MakePoint(${route.fromLng}::double precision, ${route.fromLat}::double precision), 4326)::geography,
          "destGeom" = ST_SetSRID(ST_MakePoint(${route.toLng}::double precision, ${route.toLat}::double precision), 4326)::geography,
          "routeGeom" = ST_LineFromEncodedPolyline(${routeInfo.polyline}, 5)
        WHERE id = ${booking.rideId}
      `
    }
    
    return NextResponse.json(booking)
  }

  // existing ride booking (Pool match joining)
  if (!rideId) return NextResponse.json({ error: 'Invalid booking data' }, { status: 400 })
  const ride = await prisma.ride.findUnique({ where: { id: rideId } })
  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  if (ride.seatsAvailable < 1) return NextResponse.json({ error: 'No seats available' }, { status: 400 })
  if (ride.driverId === user.id) return NextResponse.json({ error: 'You cannot book your own ride' }, { status: 400 })

  const existing = await prisma.booking.findFirst({
    where: { rideId, passengerId: user.id }
  })
  if (existing) return NextResponse.json({ error: 'Already booked' }, { status: 400 })

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: { 
        ride: { connect: { id: rideId } },
        passenger: { connect: { id: user.id } },
        status: 'PENDING',
        matchType: matchType || 'EXACT',
        finalFare: finalFare || ride.price,
        poolDiscount: poolDiscount || 0,
        otp: String(Math.floor(1000 + Math.random() * 9000))
      }
    }),
    prisma.ride.update({
      where: { id: rideId },
      data: { seatsAvailable: { decrement: 1 } }
    })
  ])

  return NextResponse.json(booking)
}