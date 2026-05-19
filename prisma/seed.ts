import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up database...");
  await prisma.leadAssignment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.webhookLog.deleteMany();
  
  // Reset sequence/identity and clean up tables
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Provider" RESTART IDENTITY CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Service" RESTART IDENTITY CASCADE;`);

  console.log("Seeding Services...");
  await prisma.service.create({
    data: { id: 1, name: "Service 1" },
  });
  await prisma.service.create({
    data: { id: 2, name: "Service 2" },
  });
  await prisma.service.create({
    data: { id: 3, name: "Service 3" },
  });

  console.log("Seeding Providers...");
  const providersData = [
    { id: 1, name: "Provider 1", serviceIds: [1, 3] },
    { id: 2, name: "Provider 2", serviceIds: [1, 3] },
    { id: 3, name: "Provider 3", serviceIds: [1, 3] },
    { id: 4, name: "Provider 4", serviceIds: [1, 3] },
    { id: 5, name: "Provider 5", serviceIds: [2, 3] },
    { id: 6, name: "Provider 6", serviceIds: [2, 3] },
    { id: 7, name: "Provider 7", serviceIds: [2, 3] },
    { id: 8, name: "Provider 8", serviceIds: [2, 3] },
  ];

  for (const prov of providersData) {
    await prisma.provider.create({
      data: {
        id: prov.id,
        name: prov.name,
        leadsCount: 0,
        maxQuota: 10,
        lastAssignedAt: new Date(),
        services: {
          connect: prov.serviceIds.map((id) => ({ id })),
        },
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
