import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET() {
  const { error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "ok",
    message: "Supabase connection successful",
  });
}