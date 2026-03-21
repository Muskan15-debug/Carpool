import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// PATCH - cancel a booking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.passengerId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // cancel booking + restore seat in one transaction
  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    }),
    prisma.ride.update({
      where: { id: booking.rideId },
      data: { seatsAvailable: { increment: 1 } }
    })
  ])

  return NextResponse.json(updated)
}