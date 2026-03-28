import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const booking = await prisma.booking.findFirst({
      where: { 
        passengerId: user.id,
        status: { in: ['PENDING', 'CONFIRMED', 'BOARDED'] }
      },
      include: {
        ride: {
          include: { driver: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!booking) return NextResponse.json({ error: 'No active booking' }, { status: 404 })

    return NextResponse.json(booking)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
