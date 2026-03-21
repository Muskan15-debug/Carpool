import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redis } from "./redis";

export interface MatchScoreParams {
  passengerOriginLat: number;
  passengerOriginLng: number;
  passengerDestLat: number;
  passengerDestLng: number;
  passengerGender?: string | null;
  requireFemaleDriver?: boolean;
}

/**
 * Pillar 1: Intelligent Matching Engine.
 * Rather than a simple radius search, this calculates driver detour logic by 
 * evaluating how close the passenger's origin and destination lie on the driver's encoded polyline.
 * ST_DWithin filters for acceptable detours (e.g. 2000m).
 * ST_LineLocatePoint ensures the driver hits the passenger's origin *before* their destination.
 */
export async function findMatchingRides(params: MatchScoreParams) {
  const {
    passengerOriginLat,
    passengerOriginLng,
    passengerDestLat,
    passengerDestLng,
    requireFemaleDriver
  } = params;

  const cacheKey = `rides:search:${passengerOriginLat},${passengerOriginLng}-${passengerDestLat},${passengerDestLng}`;

  // 1. Check Redis Cache for hot rides
  const cachedMatches = await redis.get(cacheKey);
  if (cachedMatches) {
    return JSON.parse(cachedMatches);
  }

  // 2. PostGIS Route Overlap Query using parameterized query
  const oLng = passengerOriginLng;
  const oLat = passengerOriginLat;
  const dLng = passengerDestLng;
  const dLat = passengerDestLat;

  const results = await prisma.$queryRaw<any[]>`
    SELECT 
      r.id,
      r."driverId",
      r.price,
      r."seatsAvailable",
      r."departureTime",
      u.rating as "driverRating",
      u."kycLevel",
      u.gender as "driverGender",
      ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) AS origin_dist,
      ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326)) AS dest_dist
    FROM "Ride" r
    JOIN "User" u ON r."driverId" = u.id
    WHERE r.status = 'ACTIVE' AND r."seatsAvailable" > 0
      ${requireFemaleDriver ? Prisma.sql`AND u.gender = 'FEMALE'` : Prisma.empty}
      AND ST_DWithin(r."routeGeom"::geography, ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)::geography, 2000)
      AND ST_DWithin(r."routeGeom"::geography, ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326)::geography, 2000)
      AND ST_LineLocatePoint(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) 
          < 
          ST_LineLocatePoint(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326))
    ORDER BY (ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${oLng}::double precision, ${oLat}::double precision), 4326)) + ST_Distance(r."routeGeom", ST_SetSRID(ST_MakePoint(${dLng}::double precision, ${dLat}::double precision), 4326))) ASC
    LIMIT 20;
  `;

  // Apply custom scoring weights
  // Route Overlap (40%) Detour Time (25%) Driver Rating (20%) Price Delta (15%)
  const scoredResults = results.map(row => {
    const detourScore = Math.max(0, 100 - (Number(row.origin_dist) + Number(row.dest_dist)) * 10);
    const ratingScore = Number(row.driverRating) * 20;
    const overallScore = (detourScore * 0.65) + (ratingScore * 0.35);
    
    return {
      ...row,
      score: overallScore
    };
  }).sort((a, b) => b.score - a.score);

  // Cache final matched results for 2 minutes
  await redis.setex(cacheKey, 120, JSON.stringify(scoredResults));

  return scoredResults;
}
