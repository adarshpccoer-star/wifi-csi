import { createClient } from "@/lib/utils/supabse/server";
import { NextResponse } from "next/server";
import { Message } from "radix-ui/form";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const id = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { data: device, error } = await supabase
      .from("devices")
      .select("*")
      .eq("id", id)
      .single(); // Returns a single object instead of an array

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ device }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("API Error:", Message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
