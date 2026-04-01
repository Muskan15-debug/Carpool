const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rides = await prisma.$queryRaw`SELECT id, status, "vehicleType", "departureTime", "routeGeom" IS NOT NULL as has_geom, ST_AsText("routeGeom") as geom_preview FROM "Ride" ORDER BY "createdAt" DESC LIMIT 5`;
  console.log(JSON.stringify(rides, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
