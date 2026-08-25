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
        { success: false, error: "Device ID is required" },
        { status: 400 },
      );
    }

    // Update by hardware device_id (not primary key UUID)
    const { data: updatedDevices, error: updateError } = await supabaseAdmin
      .from("devices")
      .update({
        status: "ONLINE",
        last_seen: new Date().toISOString(),
      })
      .eq("device_id", id)
      .select();

    if (updateError) {
      console.error("Heartbeat update error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    if (!updatedDevices || updatedDevices.length === 0) {
      return NextResponse.json(
        { success: false, error: "Device not found for heartbeat" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Heartbeat received",
      device: updatedDevices[0],
    });
  } catch (error) {
    console.error("Heartbeat processing error:", error);
    return NextResponse.json(
      { success: false, error: "Heartbeat processing failed" },
      { status: 500 },
    );
  }
}
