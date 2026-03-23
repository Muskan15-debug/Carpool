import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// PATCH - cancel, confirm, or decline a booking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const booking = await prisma.booking.findUnique({ 
    where: { id },
    include: { ride: true }
  })
  
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'CANCEL' // 'CANCEL', 'CONFIRM', 'DECLINE'

  const isPassenger = booking.passengerId === user.id
  const isDriver = booking.ride.driverId === user.id

  if (!isPassenger && !isDriver) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'CANCEL') {
    if (!isPassenger) return NextResponse.json({ error: 'Only passenger can cancel' }, { status: 403 })
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

    const [updated] = await prisma.$transaction([
      prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }),
      prisma.ride.update({ where: { id: booking.rideId }, data: { seatsAvailable: { increment: 1 } } })
    ])
    return NextResponse.json(updated)
  }

  if (action === 'DECLINE') {
    if (!isDriver) return NextResponse.json({ error: 'Only driver can decline' }, { status: 403 })
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

    const [updated] = await prisma.$transaction([
      prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }), // Declined becomes cancelled
      prisma.ride.update({ where: { id: booking.rideId }, data: { seatsAvailable: { increment: 1 } } })
    ])
    return NextResponse.json(updated)
  }

  if (action === 'CONFIRM') {
    if (!isDriver) return NextResponse.json({ error: 'Only driver can confirm' }, { status: 403 })
    if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Can only confirm pending bookings' }, { status: 400 })

    const updated = await prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED' } })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}