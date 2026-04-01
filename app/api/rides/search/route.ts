import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { calculateSoloFare, calculatePoolFare, getDiscountPercent, VEHICLE_RATES } from "@/lib/fareEngine"

// POST /api/rides/search - Passenger searches for pool matches
export async function POST(req: Request) {
  let body: any = {}
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    body = await req.json()
    const { originLat, originLng, destLat, destLng, vehicleType, distanceKm } = body

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json({ error: "Missing location parameters" }, { status: 400 })
    }

    const vType = vehicleType || 'MINI_CAB'
    const distance = distanceKm || 10
    const soloFare = calculateSoloFare(vType, distance)

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user?.role === 'DRIVER') {
      return NextResponse.json({ error: "Drivers cannot search for rides." }, { status: 403 })
    }

    // Find rides with matching routes using PostGIS
    const oLng = parseFloat(originLng)
    const oLat = parseFloat(originLat)
    const dLng = parseFloat(destLng)
    const dLat = parseFloat(destLat)

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r."driverId",
        r.price,
        r."seatsAvailable",
        r."departureTime",
        r."vehicleType",
        r."fromAddress",
        r."toAddress",
        r."distanceKm",
        p.name as "passengerName",
        p.rating as "passengerRating",
        p."kycLevel" as "passengerKycLevel",
        p.avatar as "passengerAvatar",
        ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) AS origin_dist,
        ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326)) AS dest_dist,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(r."fromLng", r."fromLat"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)::geography
        ) AS from_origin_dist,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(r."toLng", r."toLat"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326)::geography
        ) AS to_dest_dist
      FROM "Ride" r
      JOIN (
        SELECT DISTINCT ON ("rideId") "rideId", "passengerId"
        FROM "Booking"
        ORDER BY "rideId", "createdAt" ASC
      ) first_booking ON first_booking."rideId" = r.id
      JOIN "User" p ON first_booking."passengerId" = p.id
      WHERE r.status IN ('ACTIVE', 'DRIVER_ASSIGNED', 'SEARCHING', 'IN_PROGRESS')
        AND r."routeGeom" IS NOT NULL
        AND r."seatsAvailable" > 0
        AND r."departureTime" > NOW() - INTERVAL '2 hours'
        AND r."vehicleType" = ${vType}
        AND ST_DWithin(r."routeGeom"::geography, ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)::geography, 3000)
        AND ST_DWithin(r."routeGeom"::geography, ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326)::geography, 3000)
        AND ST_LineLocatePoint(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) 
            < 
            ST_LineLocatePoint(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326))
      ORDER BY (ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) + ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326))) ASC
      LIMIT 10;
    `

    // Classify match types and calculate fares
    const matches = results.map(row => {
      const fromDist = Number(row.from_origin_dist)
      const toDist = Number(row.to_dest_dist)
      
      let matchType: string
      if (fromDist < 500 && toDist < 500) {
        matchType = 'EXACT'
      } else if (fromDist < 500 && toDist >= 500) {
        matchType = 'DEST_ON_ROUTE'
      } else {
        matchType = 'SOURCE_ON_ROUTE'
      }

      const poolFare = calculatePoolFare(vType, distance, matchType)
      const discount = getDiscountPercent(matchType)
      const detourMinutes = Math.round((Number(row.origin_dist) + Number(row.dest_dist)) * 2)
      const etaMinutes = Math.round(4 + Math.random() * 8) // Simulated ETA

      return {
        rideId: row.id,
        driverId: row.driverId,
        passengerName: row.passengerName,
        passengerRating: Number(row.passengerRating),
        passengerAvatar: row.passengerAvatar,
        isVerified: Number(row.passengerKycLevel) >= 1,
        fromAddress: row.fromAddress,
        toAddress: row.toAddress,
        matchType,
        poolFare,
        soloFare,
        discount,
        detourMinutes,
        etaMinutes,
      }
    })

    return NextResponse.json({
      matches,
      soloFare,
      vehicleType: vType,
      distanceKm: distance,
      rate: VEHICLE_RATES[vType],
    })
  } catch (err: any) {
    console.error("Ride search error:", err?.message || err)
    console.error("Search params:", { originLat: body?.originLat, originLng: body?.originLng, destLat: body?.destLat, destLng: body?.destLng, vehicleType: body?.vehicleType })
    // Return empty results on PostGIS errors (e.g. no routeGeom data)
    return NextResponse.json({
      matches: [],
      soloFare: 0,
      vehicleType: 'MINI_CAB',
      distanceKm: 0,
      rate: VEHICLE_RATES['MINI_CAB'],
      error: err?.message || 'Search failed',
    })
  }
}
