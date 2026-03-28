import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { role, vehicleType, vehiclePlate, vehicleModel } = body

    if (!role || !['PASSENGER', 'DRIVER'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    
    if (!user) {
      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
      const clerkUser = await clerk.users.getUser(userId)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "Unknown User",
          avatar: clerkUser.imageUrl,
          role,
          isDriver: role === 'DRIVER',
          vehicleType: role === 'DRIVER' ? vehicleType : null,
          vehiclePlate: role === 'DRIVER' ? vehiclePlate : null,
          vehicleModel: role === 'DRIVER' ? vehicleModel : null,
        }
      })
    } else {
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          role,
          isDriver: role === 'DRIVER',
          vehicleType: role === 'DRIVER' ? vehicleType : user.vehicleType,
          vehiclePlate: role === 'DRIVER' ? vehiclePlate : user.vehiclePlate,
          vehicleModel: role === 'DRIVER' ? vehicleModel : user.vehicleModel,
        }
      })
    }

    return NextResponse.json({ success: true, user })
  } catch (err: any) {
    console.error("Set role error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
