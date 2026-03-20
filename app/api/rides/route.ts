import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// GET - fetch all active rides
export async function GET() {
  const rides = await prisma.ride.findMany({
    where: { status: 'ACTIVE' },
    include: { driver: true },
    orderBy: { departureTime: 'asc' }
  })
  return NextResponse.json(rides)
}

// POST - create a ride
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const ride = await prisma.ride.create({
    data: {
      driverId: user.id,
      fromAddress: body.fromAddress,
      fromLat: body.fromLat,
      fromLng: body.fromLng,
      toAddress: body.toAddress,
      toLat: body.toLat,
      toLng: body.toLng,
      departureTime: new Date(body.departureTime),
      seatsAvailable: body.seatsAvailable,
      price: body.price,
      status: 'ACTIVE'
    }
  })
  return NextResponse.json(ride)
}