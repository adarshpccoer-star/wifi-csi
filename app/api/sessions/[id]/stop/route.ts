import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data: session, error: findError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active sessions can be stopped" },
        { status: 409 },
      );
    }

    const endedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "COMPLETED",
        ended_at: endedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Stop session error:", error);

      return NextResponse.json(
        { error: "Failed to stop session" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
