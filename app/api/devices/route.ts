import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("devices")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch devices:", error);

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
      devices: data ?? [],
    });
  } catch (error) {
    console.error("GET /api/devices error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices",
      },
      { status: 500 },
    );
  }
}
