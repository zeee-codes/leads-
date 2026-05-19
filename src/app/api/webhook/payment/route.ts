import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body payload.",
        },
        { status: 400 }
      );
    }

    const { eventId, providerId, action } = body;

    // Validate inputs
    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid non-empty 'eventId' string is required.",
        },
        { status: 400 }
      );
    }

    const parsedProviderId = Number(providerId);
    if (isNaN(parsedProviderId)) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid numeric 'providerId' is required.",
        },
        { status: 400 }
      );
    }

    if (action !== "RESET_QUOTA") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Action must be 'RESET_QUOTA'.",
        },
        { status: 400 }
      );
    }

    const trimmedEventId = eventId.trim();

    // 1. Check idempotency: Has this eventId already been processed?
    const existingLog = await prisma.webhookLog.findUnique({
      where: { eventId: trimmedEventId },
    });

    if (existingLog) {
      return NextResponse.json(
        {
          success: true,
          code: "ALREADY_PROCESSED",
          message: "This webhook event has already been processed.",
          alreadyProcessed: true,
        },
        { status: 200 }
      );
    }

    // 2. Perform validation inside a transaction or query
    const provider = await prisma.provider.findUnique({
      where: { id: parsedProviderId },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          code: "PROVIDER_NOT_FOUND",
          message: `No provider found with ID ${parsedProviderId}.`,
        },
        { status: 404 }
      );
    }

    // 3. Process the webhook and store the log atomically
    await prisma.$transaction(async (tx) => {
      // Create WebhookLog
      await tx.webhookLog.create({
        data: {
          eventId: trimmedEventId,
          payload: body,
        },
      });

      // Reset provider's leadsCount to 0
      await tx.provider.update({
        where: { id: parsedProviderId },
        data: {
          leadsCount: 0,
          lastAssignedAt: new Date(), // Push to back of round-robin cue so they start fresh
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: `Quota reset successfully for provider ${provider.name}.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in webhook processing:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to process webhook.",
      },
      { status: 500 }
    );
  }
}
