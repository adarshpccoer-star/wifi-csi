import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const mlTelemetrySchema = z.object({
  timestamp: z.string().datetime(),

  telemetry: z.object({
    temporal_cv_a: z.number(),
    temporal_cv_b: z.number(),
    spatial_mean_a: z.number(),
    spatial_mean_b: z.number(),
    differential_ratio: z.number(),
  }),
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required in search params (?sessionId=UUID)",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const validationResult = mlTelemetrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid telemetry payload",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Session is not active",
        },
        { status: 409 },
      );
    }

    const { data: telemetryRow, error } = await supabaseAdmin
      .from("telemetry")
      .insert({
        session_id: sessionId,

        timestamp: data.timestamp,

        temporal_cv_a: data.telemetry.temporal_cv_a,

        temporal_cv_b: data.telemetry.temporal_cv_b,

        spatial_mean_a: data.telemetry.spatial_mean_a,

        spatial_mean_b: data.telemetry.spatial_mean_b,

        differential_ratio: data.telemetry.differential_ratio,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert ML telemetry:", error);

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
      telemetry: telemetryRow,
    });
  } catch (error) {
    console.error("POST telemetry error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Telemetry processing failed",
      },
      { status: 500 },
    );
  }
}
