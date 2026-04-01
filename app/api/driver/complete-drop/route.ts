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
    const { bookingId } = body

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    })

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    if (booking.ride.driverId !== user.id) return NextResponse.json({ error: "Not your ride" }, { status: 403 })

    // Complete the passenger trip
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    })
    
    // Restore the seat
    await prisma.ride.update({
      where: { id: booking.rideId },
      data: { seatsAvailable: { increment: booking.seats || 1 } }
    })
    
    // Check if ALL bookings are completed or cancelled. If so, mark whole ride as COMPLETE
    const rideBookings = await prisma.booking.findMany({
      where: { rideId: booking.rideId, status: { notIn: ['COMPLETED', 'CANCELLED'] } }
    })
    
    if (rideBookings.length === 0) {
      await prisma.ride.update({
        where: { id: booking.rideId },
        data: { status: 'COMPLETED' }
      })
      return NextResponse.json({ success: true, rideEnded: true })
    }

    return NextResponse.json({ success: true, rideEnded: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
