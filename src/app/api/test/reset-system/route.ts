import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Delete lead assignments, leads, and webhook logs in transaction-safe order
    await prisma.$transaction(async (tx) => {
      await tx.leadAssignment.deleteMany();
      await tx.lead.deleteMany();
      await tx.webhookLog.deleteMany();

      // Reset all providers' leadsCount to 0
      await tx.provider.updateMany({
        data: {
          leadsCount: 0,
          lastAssignedAt: new Date(),
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "System has been completely reset. All dynamic data wiped and provider quotas reset to 0/10.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/test/reset-system:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to reset system state.",
      },
      { status: 500 }
    );
  }
}
