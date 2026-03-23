import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(
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
  if (booking.ride.driverId !== user.id) return NextResponse.json({ error: 'Only the driver can verify OTP' }, { status: 403 })
  if (booking.status !== 'CONFIRMED') return NextResponse.json({ error: 'Booking must be CONFIRMED before it can be verified' }, { status: 400 })

  const { otp } = await req.json()
  if (booking.otp !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'BOARDED' }
  })

  return NextResponse.json(updated)
}
