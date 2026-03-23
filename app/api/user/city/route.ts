import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { city } = await req.json()
    if (typeof city !== 'string') {
      return NextResponse.json({ error: 'Invalid city format' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: { city }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user city:', error)
    return NextResponse.json({ error: 'Failed to update city' }, { status: 500 })
  }
}
