import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Pillar 5: Smart Cancellation Logic
 * Free cancellation until 2h before ride. After that, a tiered penalty
 * (25% → 50% → 100% of fare) kicks in.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId, cancelReason } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true }
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status === "CANCELLED") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

    // Verify the requesting user owns this booking
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || booking.passengerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const departure = new Date(booking.ride.departureTime);
    const diffHours = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    const fare = booking.ride.price;

    let penaltyPercent = 0;
    
    // Tiered penalty rules
    if (diffHours < 0) {
      penaltyPercent = 100; // After ride started/missed
    } else if (diffHours < 0.5) {
      penaltyPercent = 100; // < 30 mins before
    } else if (diffHours < 1) {
      penaltyPercent = 50;  // 30m - 1h before
    } else if (diffHours < 2) {
      penaltyPercent = 25;  // 1h - 2h before
    } else {
      penaltyPercent = 0;   // > 2 hours before -> Free
    }

    const penaltyAmount = (fare * penaltyPercent) / 100;

    // Execute cancellation transaction
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
      }),
      prisma.ride.update({
        where: { id: booking.ride.id },
        data: { seatsAvailable: { increment: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      penaltyApplied: penaltyAmount > 0,
      penaltyAmount,
      penaltyPercent,
      refundAmount: fare - penaltyAmount
    });

  } catch (err: any) {
    console.error("Cancellation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
