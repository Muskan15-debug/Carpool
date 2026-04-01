import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user?.role === 'PASSENGER') return NextResponse.json({ error: "Passengers cannot access driver endpoints." }, { status: 403 })


    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verification is instant for testing purposes
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { kycStatus: 'VERIFIED', kycLevel: 1 }
    })

    return NextResponse.json({ success: true, status: updated.kycStatus })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
