import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find user id from Clerk
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const ride = await prisma.ride.findFirst({
      where: { id: p.id, driverId: user.id },
      include: {
        bookings: {
          include: { passenger: true }
        }
      }
    })

    if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })

    return NextResponse.json(ride)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
