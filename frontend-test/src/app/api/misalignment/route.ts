import { NextRequest, NextResponse } from "next/server";
import { runMisalignment } from "@/lib/guardrails/misalignment";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "";
  const mode = body.mode === "production" ? "production" : "evaluation";
  return NextResponse.json(runMisalignment(input, mode));
}