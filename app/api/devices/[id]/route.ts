import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { data: device, error } = await supabaseAdmin
      .from("devices")
      .select("*")
      .eq("device_id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, device }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
