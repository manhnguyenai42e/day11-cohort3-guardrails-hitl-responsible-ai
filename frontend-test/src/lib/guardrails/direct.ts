import type { GuardResult } from "@/lib/types";

const PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+dan/i,
  /do\s+anything\s+now/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /bỏ\s+qua\s+(mọi|tất\s+cả)\s+chỉ\s+dẫn/i,
  /tiết\s+lộ\s+system\s+prompt/i,
];

export function runDirectGuard(input: string): GuardResult {
  const lower = input.toLowerCase();
  const steps: GuardResult["steps"] = [];
  for (const pattern of PATTERNS) {
    const hit = pattern.test(lower);
    steps.push({ guardrail: "InputGuardrail", status: hit ? "blocked" : "pass", label: pattern.source });
    if (hit) {
      return {
        scenario: "direct-injection",
        verdict: "BLOCKED",
        steps,
        reason: "[GUARDRAIL BLOCKED] Phát hiện hành vi Prompt Injection! Yêu cầu bị từ chối.",
      };
    }
  }
  return {
    scenario: "direct-injection",
    verdict: "SAFE",
    steps,
    reason: "Input hợp lệ — gửi tiếp cho LLM (dựng mô phỏng an toàn).",
  };
}
