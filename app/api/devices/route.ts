import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

export async function GET() {
  try {
    // 1. Stale Timeout Threshold (e.g., 15 seconds)
    const STALE_THRESHOLD_MS = 15 * 1000;
    const cutoffDate = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

    // 2. Mark stale devices as OFFLINE
    await supabaseAdmin
      .from("devices")
      .update({ status: "OFFLINE" })
      .eq("status", "ONLINE")
      .lt("last_seen", cutoffDate);

    // 3. Retrieve all devices ordered by creation date
    const { data, error } = await supabaseAdmin
      .from("devices")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch devices:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      devices: data ?? [],
    });
  } catch (error) {
    console.error("GET /api/devices error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch devices" },
      { status: 500 },
    );
  }
}
