import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid session data",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        name: result.data.name,
        status: "CREATED",
      })
      .select()
      .single();

    if (error) {
      console.error("Create session error:", error);

      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get sessions error:", error);

      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sessions: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
