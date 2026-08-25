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

    // Check session
    const { data: session, error: findError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Session is already active" },
        { status: 409 },
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed session cannot be restarted" },
        { status: 409 },
      );
    }

    const startedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "ACTIVE",
        started_at: startedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Start session error:", error);

      return NextResponse.json(
        { error: "Failed to start session" },
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
