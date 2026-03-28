import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await prisma.user.update({
      where: { clerkId: userId },
      data: { isOnline: false, currentLat: null, currentLng: null },
    })

    return NextResponse.json({ success: true, isOnline: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
