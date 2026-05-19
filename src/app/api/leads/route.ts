import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { id: "asc" },
      include: {
        services: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                phone: true,
                city: true,
                description: true,
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const assignments = await prisma.leadAssignment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            description: true,
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          providers: providers.map((p) => ({
            id: p.id,
            name: p.name,
            leadsCount: p.leadsCount,
            maxQuota: p.maxQuota,
            lastAssignedAt: p.lastAssignedAt,
            isFrozen: p.leadsCount >= p.maxQuota,
            services: p.services.map((s) => s.name),
            leadsList: p.assignments.map((a) => ({
              leadId: a.lead.id,
              name: a.lead.name,
              phone: a.lead.phone,
              city: a.lead.city,
              description: a.lead.description,
              serviceName: a.lead.service.name,
              isMandatory: a.isMandatory,
              createdAt: a.createdAt,
            })),
          })),
          assignments: assignments.map((a) => ({
            id: a.id,
            leadId: a.leadId,
            leadName: a.lead.name,
            leadPhone: a.lead.phone,
            leadCity: a.lead.city,
            leadDescription: a.lead.description,
            serviceName: a.lead.service.name,
            providerId: a.providerId,
            providerName: a.provider.name,
            isMandatory: a.isMandatory,
            createdAt: a.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in GET /api/leads:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to fetch dashboard data.",
      },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
