import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { findMatchingRides } from '@/lib/matchingEngine'

// GET - fetch all active rides
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const oLat = searchParams.get('originLat')
  const oLng = searchParams.get('originLng')
  const dLat = searchParams.get('destLat')
  const dLng = searchParams.get('destLng')

  if (oLat && oLng && dLat && dLng) {
    try {
      const matches = await findMatchingRides({
        passengerOriginLat: parseFloat(oLat),
        passengerOriginLng: parseFloat(oLng),
        passengerDestLat: parseFloat(dLat),
        passengerDestLng: parseFloat(dLng)
      })
      return NextResponse.json(matches)
    } catch (err: any) {
      console.error('Error finding matching rides:', err)
      return NextResponse.json({ error: 'Failed to find rides' }, { status: 500 })
    }
  }

  const fromCity = searchParams.get('fromCity')

  // Fallback: Return all active rides with available seats (with optional city filter)
  const whereClause: any = { 
    status: 'ACTIVE',
    seatsAvailable: { gt: 0 },
    departureTime: { gt: new Date() }
  }

  if (fromCity) {
    whereClause.fromAddress = { contains: fromCity, mode: 'insensitive' }
  }

  const rides = await prisma.ride.findMany({
    where: whereClause,
    include: { driver: true },
    orderBy: { departureTime: 'asc' }
  })
  return NextResponse.json(rides)
}