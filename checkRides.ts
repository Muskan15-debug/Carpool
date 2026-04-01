import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rides = await prisma.$queryRaw`SELECT 
    id, status, "vehicleType", "departureTime", "routeGeom" IS NOT NULL as has_geom, 
    ST_AsText("routeGeom") as geom_preview,
    "fromAddress", "toAddress"
  FROM "Ride" 
  ORDER BY "createdAt" DESC LIMIT 5`;
  console.log(JSON.stringify(rides, (key, value) =>
      typeof value === "bigint" ? value.toString() : value, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
