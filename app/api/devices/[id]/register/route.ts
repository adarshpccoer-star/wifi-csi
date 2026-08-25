import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Device ID is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const { name, location_x, location_y, location_z } = body;

    // Check whether device already exists
    const { data: existingDevice, error: existingError } = await supabaseAdmin
      .from("devices")
      .select("*")
      .eq("device_id", id)
      .maybeSingle();

    if (existingError) {
      console.error("Device lookup error:", existingError);

      return NextResponse.json(
        {
          success: false,
          error: existingError.message,
        },
        { status: 500 },
      );
    }

    // Already registered
    if (existingDevice) {
      return NextResponse.json({
        success: true,
        message: "Device already registered",
        device: existingDevice,
      });
    }

    // Create device
    const { data: device, error: insertError } = await supabaseAdmin
      .from("devices")
      .insert({
        device_id: id,
        name: name || id,
        status: "OFFLINE",
        last_seen: null,
        location_x: location_x ?? 0,
        location_y: location_y ?? 0,
        location_z: location_z ?? 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Device registration error:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Device registered successfully",
        device,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Device registration failed",
      },
      { status: 500 },
    );
  }
}
