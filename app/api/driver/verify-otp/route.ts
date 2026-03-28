import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { bookingId, otp } = body

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    })

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    if (booking.ride.driverId !== user.id) return NextResponse.json({ error: "Not your ride" }, { status: 403 })

    // Verify OTP
    if (booking.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Please check the code." }, { status: 400 })
    }

    // Update status to BOARDED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'BOARDED' },
    })
    
    // Ensure overall ride is IN_PROGRESS
    if (booking.ride.status !== 'IN_PROGRESS') {
      await prisma.ride.update({
        where: { id: booking.rideId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
