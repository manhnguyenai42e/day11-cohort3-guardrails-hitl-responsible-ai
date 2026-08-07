export type AttackVerdict = "BLOCKED" | "SAFE" | "LEAKED" | "PENDING_HITL";

export interface AttackStep {
  guardrail: string;
  status: "pass" | "blocked" | "triggered";
  label: string;
}

export interface GuardResult {
  scenario: string;
  verdict: AttackVerdict;
  steps: AttackStep[];
  reason: string;
  pending?: {
    toolName: string;
    toolArgs: Record<string, unknown>;
    title: string;
    description: string;
  };
  audit?: string[];
}