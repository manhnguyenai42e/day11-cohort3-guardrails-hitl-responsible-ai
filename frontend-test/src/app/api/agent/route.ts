import { NextRequest, NextResponse } from "next/server";
import { askGeminiForToolCall } from "@/lib/gemini";
import { applyAgentGuardrails } from "@/lib/guardrails/agent";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "Tìm review khách sạn ABC Đà Nẵng giúp tôi.";
  const useGuard = body.guard !== false; // default secure
  const toxic = body.toxic !== false;

  if (!useGuard) {
    try {
      const call = await askGeminiForToolCall(input, toxic ? "high" : "normal");
      return NextResponse.json({
        scenario: "agent-security", verdict: "LEAKED", steps: [],
        reason: call ? `Agent đã cố gọi ${call.toolName}(${JSON.stringify(call.args)}) nếu không có guardrail.` : "Agent không gọi tool nguy hiểm.",
        pending: null,
      });
    } catch (e: any) {
      return NextResponse.json({ scenario: "agent-security", verdict: "SAFE", steps: [], reason: String(e.message).includes("NO_API_KEY") ? "Thiếu GEMINI_API_KEY." : "Lỗi Gemini." });
    }
  }

  let prefix;
  try {
    prefix = await askGeminiForToolCall(input, toxic ? "high" : "normal");
  } catch (e: any) {
    return NextResponse.json({ scenario: "agent-security", verdict: "SAFE", steps: [], reason: String(e.message).includes("NO_API_KEY") ? "Thiếu GEMINI_API_KEY." : "Lỗi Gemini." });
  }
  if (!prefix) {
    return NextResponse.json({ scenario: "agent-security", verdict: "SAFE", steps: [], reason: "Agent chọn không gọi tool nguy hiểm." });
  }
  return NextResponse.json(applyAgentGuardrails(prefix.toolName, prefix.args, null));
}