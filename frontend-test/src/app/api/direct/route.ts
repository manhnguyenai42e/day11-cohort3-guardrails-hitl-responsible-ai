import { NextRequest, NextResponse } from "next/server";
import { runDirectGuard } from "@/lib/guardrails/direct";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "";
  return NextResponse.json(runDirectGuard(input));
}