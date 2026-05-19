import { NextResponse } from "next/server";
import { allocateLead } from "@/lib/allocation-engine";

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

    const { count, serviceId } = body;
    const parsedCount = Number(count);
    const parsedServiceId = Number(serviceId);

    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid count (between 1 and 50) is required.",
        },
        { status: 400 }
      );
    }

    if (isNaN(parsedServiceId) || parsedServiceId < 1 || parsedServiceId > 3) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid serviceId (1, 2, or 3) is required.",
        },
        { status: 400 }
      );
    }

    const logs: string[] = [];
    const timestamp = Date.now();

    for (let i = 1; i <= parsedCount; i++) {
      const name = `Test Customer ${i}`;
      // Ensure phone is unique by appending index and timestamp
      const phone = `+1555${timestamp}${i}`;

      try {
        const result = await allocateLead(name, phone, parsedServiceId);
        
        // Format allocation assignment log
        const assignmentsStr = result.assignments
          .map((a) => `${a.providerName} (${a.isMandatory ? "Mandatory" : "Pool"})`)
          .join(", ");
        
        logs.push(`[Lead ${i}] Created. Assigned to: ${assignmentsStr}`);
      } catch (err: any) {
        logs.push(`[Lead ${i}] Failed to allocate: ${err.message || err.code || "Unknown error"}`);
        // If we hit insufficient providers, we can stop the loop early to avoid spamming the log
        if (err.code === "INSUFFICIENT_PROVIDERS") {
          logs.push(`[System] Halted sequential generation early due to lack of eligible providers.`);
          break;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          logs,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/test/generate-leads:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to generate test leads.",
      },
      { status: 500 }
    );
  }
}
