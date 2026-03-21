import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Pillar 4: Silent Check-in ping
 * At T+15min into a ride, silently ping the passenger "Everything ok?".
 * This endpoint could be triggered by an external cron (e.g. BullMQ or Inngest)
 * passing all active rides that departed 15 minutes ago.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Determine the time window (rides that started exactly 15 mins ago)
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
    const sixteenMinsAgo = new Date(now.getTime() - 16 * 60000);

    const activeBookingsTargeted = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        ride: {
          status: 'IN_PROGRESS',
          departureTime: {
            gte: sixteenMinsAgo,
            lte: fifteenMinsAgo
          }
        }
      },
      include: {
        passenger: true,
        ride: {
          include: { driver: true }
        }
      }
    });

    let pingCount = 0;

    for (const booking of activeBookingsTargeted) {
      const p = booking.passenger;
      console.log(`[SILENT CHECK-IN] Sending push/SMS to Passenger ${p.name}`);
      console.log(`Message: "Everything ok? Reply NO to alert emergency contacts."`);
      // Here you'd use Twilio / FCM / Web Push
      pingCount++;
    }

    return NextResponse.json({
      success: true,
      pings_sent: pingCount,
      timestamp: now.toISOString()
    });

  } catch (err: any) {
    console.error("Silent checkin cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
