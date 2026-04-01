import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Fetch most recently completed booking
    const booking = await prisma.booking.findFirst({
      where: {
        passengerId: user.id,
        status: { in: ['COMPLETED', 'BOARDED'] }
      },
      include: {
        ride: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                avatar: true,
                rating: true,
                vehicleModel: true,
                vehiclePlate: true,
              }
            },
            bookings: {
              where: {
                passengerId: { not: user.id },
                status: { in: ['COMPLETED', 'BOARDED', 'CONFIRMED'] }
              },
              include: {
                passenger: {
                  select: { id: true, name: true, rating: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!booking) return NextResponse.json({ error: 'No completed booking found' }, { status: 404 })

    return NextResponse.json({
      id: booking.id,
      finalFare: booking.finalFare,
      poolDiscount: booking.poolDiscount,
      matchType: booking.matchType,
      createdAt: booking.createdAt,
      ride: {
        fromAddress: booking.ride.fromAddress,
        toAddress: booking.ride.toAddress,
        distanceKm: booking.ride.distanceKm,
        estimatedMinutes: booking.ride.estimatedMinutes,
        vehicleType: booking.ride.vehicleType,
        driver: booking.ride.driver,
        // Co-passengers (anonymised)
        coPassengers: booking.ride.bookings.map(b => ({
          id: b.passenger.id,
          name: b.passenger.name,
          rating: b.passenger.rating,
        }))
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
