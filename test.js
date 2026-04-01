const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const route = { vehicleType: 'MINI_CAB', fromLng: 72.82, fromLat: 19.01 };
  try {
    const drivers = await prisma.$queryRaw`
      SELECT id 
      FROM "User" 
      WHERE "role" = 'DRIVER' 
        AND "isOnline" = true 
        AND "vehicleType" = ${route.vehicleType}
        AND "currentLat" IS NOT NULL 
        AND "currentLng" IS NOT NULL
      ORDER BY ST_Distance(
        ST_SetSRID(ST_MakePoint("currentLng"::double precision, "currentLat"::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${route.fromLng}::double precision, ${route.fromLat}::double precision), 4326)::geography
      ) ASC
      LIMIT 1;
    `;
    console.log("Success:", drivers);
  } catch(e) {
    console.error("Query Error:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
