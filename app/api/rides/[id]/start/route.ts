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

  const ride = await prisma.ride.findUnique({ where: { id } })
  
  if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  if (ride.driverId !== user.id) return NextResponse.json({ error: 'Only driver can start the ride' }, { status: 403 })

  const updated = await prisma.ride.update({
    where: { id },
    data: { status: 'IN_PROGRESS' }
  })

  return NextResponse.json(updated)
}
