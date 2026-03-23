import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

function decodePolyline(encoded: string) {
  const points: number[][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      // Sync user on the fly if missing from Database (e.g. wiped dev db)
      const { createClerkClient } = await import('@clerk/backend');
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const clerkUser = await clerk.users.getUser(userId);
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "Unknown User",
          avatar: clerkUser.imageUrl,
        }
      });
    }

    const body = await req.json();
    const { fromAddress, fromLat, fromLng, toAddress, toLat, toLng, departureTime, seatsAvailable, price, isRecurring, recurringDays } = body;

    // Fetch Polyline from Mapbox Directions API
    const mapboxApiKey = process.env.MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    let polyline = body.polyline;
    let routeWKT = body.routeWKT;

    if (!polyline && mapboxApiKey) {
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${mapboxApiKey}`;
      const dirRes = await fetch(directionsUrl);
      const dirData = await dirRes.json();
      if (dirData.routes && dirData.routes.length > 0) {
        polyline = dirData.routes[0].geometry;
      }
    }

    if (polyline && !routeWKT) {
      const coords = decodePolyline(polyline);
      routeWKT = `LINESTRING(${coords.map(c => `${c[1]} ${c[0]}`).join(', ')})`;
    }

    if (!routeWKT) {
      routeWKT = `LINESTRING(${fromLng} ${fromLat}, ${toLng} ${toLat})`;
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: user.id, fromAddress, fromLat, fromLng, toAddress, toLat, toLng,
        polyline, departureTime: new Date(departureTime), seatsAvailable: parseInt(seatsAvailable),
        price: parseFloat(price), isRecurring: isRecurring || false, recurringDays: recurringDays || [],
        status: "ACTIVE"
      }
    });

    // Use parameterized query to prevent SQL injection
    await prisma.$executeRaw`
      UPDATE "Ride" 
      SET "routeGeom" = ST_GeomFromText(${routeWKT}, 4326),
          "originGeom" = ST_SetSRID(ST_MakePoint(${fromLng}::double precision, ${fromLat}::double precision), 4326),
          "destGeom" = ST_SetSRID(ST_MakePoint(${toLng}::double precision, ${toLat}::double precision), 4326)
      WHERE id = ${ride.id};
    `;

    return NextResponse.json({ success: true, rideId: ride.id });
  } catch (err: any) {
    console.error("Ride creation API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
