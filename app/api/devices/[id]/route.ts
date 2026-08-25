import { createClient } from "@/lib/utils/supabse/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: device, error } = await supabase
      .from("devices")
      .select("*")
      .eq("id", id)
      .single(); // Returns a single object instead of an array

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ device }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
