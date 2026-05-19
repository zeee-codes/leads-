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

    const { name, phone, city, description, serviceId } = body;

    // Validation checks
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid non-empty 'name' string is required.",
        },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid non-empty 'phone' string is required.",
        },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || city.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid non-empty 'city' string is required.",
        },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid non-empty 'description' string is required.",
        },
        { status: 400 }
      );
    }

    const parsedServiceId = Number(serviceId);
    if (isNaN(parsedServiceId) || parsedServiceId < 1 || parsedServiceId > 3) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "A valid 'serviceId' (1, 2, or 3) is required.",
        },
        { status: 400 }
      );
    }

    const result = await allocateLead(
      name.trim(),
      phone.trim(),
      city.trim(),
      description.trim(),
      parsedServiceId
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API error in request-service:", error);

    const code = error.code || "INTERNAL_SERVER_ERROR";
    const status = error.status || 500;
    const message = error.message || "An unexpected system error occurred.";

    return NextResponse.json(
      {
        success: false,
        code,
        message,
      },
      { status }
    );
  }
}
