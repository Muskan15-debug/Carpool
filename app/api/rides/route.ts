import { prisma } from '@/lib/prisma'
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