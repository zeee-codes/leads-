import { prisma } from "./prisma";
import { MANDATORY_RULES, TARGET_ASSIGNMENTS, MAX_QUOTA } from "./service-rules";
import { LeadAssignmentResponse } from "@/types";

export interface AllocationResult {
  leadId: number;
  name: string;
  phone: string;
  city: string;
  description: string;
  serviceId: number;
  assignments: LeadAssignmentResponse[];
}

/**
 * Core fairness and concurrency engine for lead distribution.
 * Executes within a Prisma Transaction and uses row-level locking (SELECT FOR UPDATE)
 * to prevent double-allocation/race conditions under concurrent requests.
 */
export async function allocateLead(
  name: string,
  phone: string,
  city: string,
  description: string,
  serviceId: number
): Promise<AllocationResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Acquire row-level lock on Providers to prevent simultaneous modifications
    // This blocks other concurrent transactions until this one commits or rolls back.
    await tx.$executeRawUnsafe(`SELECT * FROM "Provider" FOR UPDATE;`);

    // 2. Check for duplicate phone + serviceId
    const existingLead = await tx.lead.findUnique({
      where: {
        phone_serviceId: {
          phone,
          serviceId,
        },
      },
    });

    if (existingLead) {
      const error: any = new Error("This phone number is already registered for this specific service.");
      error.code = "DUPLICATE_LEAD_SUBMISSION";
      error.status = 409;
      throw error;
    }

    // 3. Get the service and verify it exists
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      include: {
        providers: true,
      },
    });

    if (!service) {
      const error: any = new Error("The specified service does not exist.");
      error.code = "VALIDATION_ERROR";
      error.status = 400;
      throw error;
    }

    const selectedProviders: { providerId: number; providerName: string; isMandatory: boolean }[] = [];
    const selectedIds = new Set<number>();

    // 4. Evaluate mandatory rules
    const mandatoryIds = MANDATORY_RULES[serviceId] || [];
    for (const providerId of mandatoryIds) {
      // Find the provider in the database inside transaction
      const dbProvider = await tx.provider.findUnique({
        where: { id: providerId },
        include: {
          services: {
            where: { id: serviceId }
          }
        }
      });

      // Provider must exist, belong to this service, and have quota available
      if (dbProvider && dbProvider.services.length > 0 && dbProvider.leadsCount < MAX_QUOTA) {
        selectedProviders.push({
          providerId: dbProvider.id,
          providerName: dbProvider.name,
          isMandatory: true,
        });
        selectedIds.add(dbProvider.id);
      }
    }

    // 5. Calculate remaining slots needed
    const remainingSlots = TARGET_ASSIGNMENTS - selectedProviders.length;

    if (remainingSlots > 0) {
      // Query pool providers:
      // - Must belong to this service
      // - Must have quota < MAX_QUOTA (10)
      // - Must not be already selected (mandatory)
      // - Sorted by lastAssignedAt ASC (Round-Robin fairness)
      const poolProviders = await tx.provider.findMany({
        where: {
          services: {
            some: { id: serviceId },
          },
          leadsCount: { lt: MAX_QUOTA },
          id: { notIn: Array.from(selectedIds) },
        },
        orderBy: {
          lastAssignedAt: "asc",
        },
        take: remainingSlots,
      });

      for (const p of poolProviders) {
        selectedProviders.push({
          providerId: p.id,
          providerName: p.name,
          isMandatory: false,
        });
        selectedIds.add(p.id);
      }
    }

    // 6. Verify we reached exactly 3 providers
    if (selectedProviders.length < TARGET_ASSIGNMENTS) {
      const error: any = new Error("Not enough active providers with available quota for this service.");
      error.code = "INSUFFICIENT_PROVIDERS";
      error.status = 503;
      throw error;
    }

    // 7. Commit changes:
    // Create Lead record
    const lead = await tx.lead.create({
      data: {
        name,
        phone,
        city,
        description,
        serviceId,
      },
    });

    // Create assignments and update provider lead counts and lastAssignedAt timestamps
    for (const p of selectedProviders) {
      await tx.leadAssignment.create({
        data: {
          leadId: lead.id,
          providerId: p.providerId,
          isMandatory: p.isMandatory,
        },
      });

      await tx.provider.update({
        where: { id: p.providerId },
        data: {
          leadsCount: { increment: 1 },
          lastAssignedAt: new Date(),
        },
      });
    }

    return {
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      city: lead.city,
      description: lead.description,
      serviceId: lead.serviceId,
      assignments: selectedProviders,
    };
  });
}
