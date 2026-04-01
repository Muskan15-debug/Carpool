import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user?.role === 'PASSENGER') return NextResponse.json({ error: "Passengers cannot access driver endpoints." }, { status: 403 })


    const body = await req.json()
    const { lat, lng } = body

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: { 
        isOnline: true, 
        currentLat: lat || null, 
        currentLng: lng || null 
      },
    })

    return NextResponse.json({ success: true, isOnline: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
