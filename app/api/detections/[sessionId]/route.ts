import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("detections")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Failed to fetch detections:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sessionId,
      count: data.length,
      detections: data,
    });
  } catch (error) {
    console.error("GET detections error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch detections",
      },
      { status: 500 },
    );
  }
}
