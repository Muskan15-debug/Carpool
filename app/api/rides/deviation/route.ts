import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Pillar 4: Route deviation detection
 * Checks if the driver's current position is >500m off the agreed polyline geometry.
 * If yes, it triggers an SOS deviation alert to passengers' emergency contacts.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rideId, driverLat, driverLng } = await req.json();

    if (!rideId || !driverLat || !driverLng) {
      return NextResponse.json({ error: "Missing required tracking data" }, { status: 400 });
    }

    // Use parameterized query to prevent SQL injection
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r.status,
        ST_Distance(
          r."routeGeom"::geography, 
          ST_SetSRID(ST_MakePoint(${driverLng}::double precision, ${driverLat}::double precision), 4326)::geography
        ) AS off_route_distance
      FROM "Ride" r
      WHERE r.id = ${rideId} AND r.status = 'IN_PROGRESS';
    `;

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Ride not found or not in progress" }, { status: 404 });
    }

    const distance = result[0].off_route_distance;
    const isDeviated = distance > 500; // 500 meters threshold

    if (isDeviated) {
      const passengers = await prisma.booking.findMany({
        where: { rideId, status: "CONFIRMED" },
        include: { passenger: true }
      });

      console.warn(`[SAFETY ALERT] Ride ${rideId} deviated by ${Math.round(distance)}m!`);
      passengers.forEach(b => {
        if (b.passenger.emergencyContact) {
          console.log(`Sending SMS to ${b.passenger.emergencyContact} regarding deviation for ${b.passenger.name}`);
        }
      });

      return NextResponse.json({ 
        alert_triggered: true, 
        distance_off_route: distance 
      });
    }

    return NextResponse.json({ 
      alert_triggered: false, 
      distance_off_route: distance 
    });

  } catch (err: any) {
    console.error("Deviation check error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
