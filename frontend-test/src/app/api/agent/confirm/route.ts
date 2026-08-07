import { NextRequest, NextResponse } from "next/server";
import { applyAgentGuardrails } from "@/lib/guardrails/agent";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const toolName = typeof body.toolName === "string" ? body.toolName : "";
  const toolArgs = (body.toolArgs ?? {}) as Record<string, unknown>;
  const decision = body.decision === "approve" || body.decision === "reject" ? body.decision : "reject";
  return NextResponse.json(applyAgentGuardrails(toolName, toolArgs, decision));
}