import { describe, it, expect } from "vitest";
import { applyAgentGuardrails, ALLOWED_TOOL_REGISTRY } from "./agent";

describe("applyAgentGuardrails", () => {
  it("rejects tool not in whitelist (Guardrail 2)", () => {
    const r = applyAgentGuardrails("delete_user_data", { user_id: "12345" }, null);
    expect(r.verdict).toBe("BLOCKED");
    expect(r.reason).toContain("unauthorized");
  });
  it("allows whitelisted safe tool without HITL", () => {
    const r = applyAgentGuardrails("web_search", {}, null);
    expect(r.verdict).toBe("SAFE");
  });
  it("reject decision cancels (Guardrail 3)", () => {
    const r = applyAgentGuardrails("make_payment", { amount: 100 }, "reject");
    expect(r.verdict).toBe("SAFE");
    expect(r.audit).toContain("human_reject");
  });
  it("approve decision executes (Guardrail 3)", () => {
    const r = applyAgentGuardrails("make_payment", { amount: 100 }, "approve");
    expect(r.verdict).toBe("SAFE");
    expect(r.audit).toContain("human_approve");
  });
});