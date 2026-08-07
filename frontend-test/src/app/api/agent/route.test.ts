// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function geminiFunctionCallResponse(name: string, args: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ functionCall: { name, args } }] } }] }),
  } as Response;
}

function geminiTextResponse(text = "Đây là câu trả lời bình thường.") {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as Response;
}

describe("POST /api/agent", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns a clear Vietnamese message when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ input: "Tìm review khách sạn", guard: true, toxic: true }));
    const data = await res.json();
    expect(data.reason).toContain("GEMINI_API_KEY");
  });

  it("sanitizes the poisoned tool output before it reaches Gemini (Guardrail 1)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiTextResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ input: "Tìm review khách sạn ABC Đà Nẵng giúp tôi.", guard: true, toxic: true }));
    const data = await res.json();

    const [, options] = fetchMock.mock.calls[0];
    const sentText: string = JSON.parse((options as RequestInit).body as string).contents[0].parts[0].text;
    expect(sentText).not.toMatch(/IGNORE ALL PREVIOUS INSTRUCTIONS/i);
    expect(sentText).toContain("[BLOCKED_INJECTION_ATTEMPT]");
    expect(data.steps[0]).toMatchObject({ guardrail: "AgentGuardrail.sanitize", status: "triggered" });
  });

  it("sends the raw poisoned tool output unmodified when guard is off (vulnerable demo)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiTextResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    await POST(makeRequest({ input: "Tìm review khách sạn ABC Đà Nẵng giúp tôi.", guard: false, toxic: true }));

    const [, options] = fetchMock.mock.calls[0];
    const sentText: string = JSON.parse((options as RequestInit).body as string).contents[0].parts[0].text;
    expect(sentText).toMatch(/IGNORE ALL PREVIOUS INSTRUCTIONS/i);
  });

  it("blocks a tool call outside the whitelist via Guardrail 2, even after sanitize passes it through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiFunctionCallResponse("delete_user_data", { user_id: "12345" })));
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ input: "x", guard: true, toxic: true }));
    const data = await res.json();
    expect(data.verdict).toBe("BLOCKED");
    expect(data.steps.some((s: { guardrail: string; status: string }) => s.guardrail === "AgentGuardrail.whitelist" && s.status === "blocked")).toBe(true);
  });

  it("returns PENDING_HITL for a whitelisted-but-risky tool call (Guardrail 3)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiFunctionCallResponse("make_payment", { amount: 100 })));
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ input: "x", guard: true, toxic: true }));
    const data = await res.json();
    expect(data.verdict).toBe("PENDING_HITL");
    expect(data.pending?.toolName).toBe("make_payment");
  });

  it("returns SAFE when Gemini answers with text instead of proposing a tool call", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiTextResponse()));
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ input: "x", guard: true, toxic: false }));
    const data = await res.json();
    expect(data.verdict).toBe("SAFE");
  });

  it("surfaces a Gemini HTTP failure as a Vietnamese error instead of crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response));
    const { POST } = await import("./route");

    const res = await POST(makeRequest({ input: "x", guard: true, toxic: true }));
    const data = await res.json();
    expect(data.verdict).toBe("SAFE");
    expect(data.reason).toContain("Lỗi Gemini");
  });
});
