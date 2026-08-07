import { NextRequest, NextResponse } from "next/server";
import { runMisalignment, runRewardHacking } from "@/lib/guardrails/misalignment";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.mode === "reward-hacking") {
    return NextResponse.json(runRewardHacking());
  }
  const input = typeof body.input === "string" ? body.input : "";
  const mode = body.mode === "production" ? "production" : "evaluation";
  return NextResponse.json(runMisalignment(input, mode));
}