import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    
    if (!user) {
      const clerkUser = await currentUser()
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || "unknown@example.com",
          name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "Unknown User",
          avatar: clerkUser?.imageUrl,
          role: 'UNASSIGNED',
        }
      })
    }

    return NextResponse.json(user)
  } catch (err: any) {
    console.error("Get user error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
