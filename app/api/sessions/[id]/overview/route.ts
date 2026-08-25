import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. Fetch Devices
    const { data: devices } = await supabaseAdmin.from("devices").select("*");

    // 3. Fetch Detections
    const { data: detections } = await supabaseAdmin
      .from("detections")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false });

    // 4. Fetch Telemetry History (Required by RescueDashboard chart hydration)
    const { data: telemetry } = await supabaseAdmin
      .from("telemetry")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })
      .limit(100);

    const safeDetections = detections ?? [];
    const safeDevices = devices ?? [];
    const safeTelemetry = telemetry ?? [];

    const possibleSurvivors = safeDetections.filter(
      (d) => d.survivor_probability > 0.5,
    ).length;

    const onlineDevices = safeDevices.filter(
      (d) => d.status === "ONLINE",
    ).length;

    return NextResponse.json({
      success: true,
      session,
      devices: safeDevices,
      detections: safeDetections,
      telemetry: safeTelemetry, // Direct fix for dashboard graph backfill
      stats: {
        totalDetections: safeDetections.length,
        possibleSurvivors,
        onlineDevices,
      },
    });
  } catch (error) {
    console.error("Overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
