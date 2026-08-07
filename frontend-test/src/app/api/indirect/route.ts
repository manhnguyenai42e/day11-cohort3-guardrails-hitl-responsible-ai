import { NextRequest, NextResponse } from "next/server";
import { runIndirectGuard } from "@/lib/guardrails/indirect";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "";
  const doc = typeof body.document === "string" ? body.document : "";
  return NextResponse.json(runIndirectGuard(input, doc));
}