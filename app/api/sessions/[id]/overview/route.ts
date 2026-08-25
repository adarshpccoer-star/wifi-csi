import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Session
    // -----------------------------

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (sessionError) {
      console.error("Session query error:", sessionError);

      return NextResponse.json(
        {
          success: false,
          error: sessionError.message,
        },
        { status: 500 },
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // Devices
    // -----------------------------

    const { data: devices, error: devicesError } = await supabaseAdmin
      .from("devices")
      .select("*")
      .order("created_at", { ascending: true });

    if (devicesError) {
      console.error("Devices query error:", devicesError);

      return NextResponse.json(
        {
          success: false,
          error: devicesError.message,
        },
        { status: 500 },
      );
    }

    // -----------------------------
    // Detections
    // -----------------------------

    const { data: detections, error: detectionsError } = await supabaseAdmin
      .from("detections")
      .select("*")
      .eq("session_id", id)
      .order("timestamp", { ascending: false });

    if (detectionsError) {
      console.error("Detections query error:", detectionsError);

      return NextResponse.json(
        {
          success: false,
          error: detectionsError.message,
        },
        { status: 500 },
      );
    }

    const safeDetections = detections ?? [];
    const safeDevices = devices ?? [];

    // -----------------------------
    // Stats
    // -----------------------------

    const possibleSurvivors = safeDetections.filter(
      (d) => d.type === "POSSIBLE_SURVIVOR",
    ).length;

    const onlineDevices = safeDevices.filter(
      (d) => d.status === "ONLINE",
    ).length;

    return NextResponse.json({
      success: true,

      session,

      devices: safeDevices,

      detections: safeDetections,

      stats: {
        totalDetections: safeDetections.length,
        possibleSurvivors,
        onlineDevices,
      },
    });
  } catch (error) {
    console.error("GET overview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch session overview",
      },
      { status: 500 },
    );
  }
}
