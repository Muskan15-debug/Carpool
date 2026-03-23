import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

  const { rideId } = await req.json()
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // check ride exists and has seats
  const ride = await prisma.ride.findUnique({ where: { id: rideId } })
  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  if (ride.seatsAvailable < 1) return NextResponse.json({ error: 'No seats available' }, { status: 400 })
  if (ride.driverId === user.id) return NextResponse.json({ error: 'You cannot book your own ride' }, { status: 400 })

  // check if already booked
  const existing = await prisma.booking.findFirst({
    where: { rideId, passengerId: user.id }
  })
  if (existing) return NextResponse.json({ error: 'Already booked' }, { status: 400 })

  // create booking + decrease seats in one transaction
  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: { 
        rideId, 
        passengerId: user.id, 
        status: 'PENDING',
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