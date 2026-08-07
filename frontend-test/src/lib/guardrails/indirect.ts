import type { GuardResult } from "@/lib/types";

const SANITIZE_PATTERNS = [
  /\[SYSTEM INSTRUCTION:.*?\]/gi,
  /ignore\s+all\s+previous\s+instructions/gi,
  /send\s+.*?\s+to\s+http/gi,
];

const ROLEPLAY_KEYWORDS = ["pretend you are dan", "do anything now", "no limits", "đóng vai"];
const BAD_WORDS = ["hack", "bypass", "exploit", "steal"];

function toSafeB64(s: string): string {
  return s.replace(/[-_]/g, (c) => (c === "-" ? "+" : "/"));
}

export function runIndirectGuard(prompt: string, document = ""): GuardResult {
  const steps: GuardResult["steps"] = [];
  let warnings = 0;

  if (document) {
    let cleaned = document;
    for (const pattern of SANITIZE_PATTERNS) {
      const had = pattern.test(cleaned);
      cleaned = cleaned.replace(pattern, "[NỘI DUNG ĐỌC LỆNH BỊ CHẶN]");
      if (had) {
        warnings++;
        steps.push({ guardrail: "RAGGuardrail.sanitize", status: "triggered", label: "Ẩn lệnh SYSTEM INSTRUCTION bị làm sạch." });
      }
    }
  }

  const lower = prompt.toLowerCase();
  steps.push({ guardrail: "JailbreakGuardrail.roleplay", status: "pass", label: "Kiểm tra từ khóa roleplay." });
  if (ROLEPLAY_KEYWORDS.some((kw) => lower.includes(kw))) {
    steps.push({ guardrail: "JailbreakGuardrail.roleplay", status: "blocked", label: "Từ khóa roleplay bị bắt." });
    return { scenario: "indirect", verdict: "BLOCKED", steps, reason: "[GUARDRAIL BLOCKED] Phát hiện kỹ thuật Roleplay/Jailbreak!" };
  }

  steps.push({ guardrail: "JailbreakGuardrail.base64", status: "pass", label: "Quét chuỗi Base64." });
  const b64Candidates = prompt.match(/[A-Za-z0-9+/]{20,}={0,2}/g) ?? [];
  for (const candidate of b64Candidates) {
    let decoded = "";
    try { decoded = Buffer.from(toSafeB64(candidate), "base64").toString("utf8").toLowerCase(); }
    catch { continue; }
    if (decoded.length < 12) continue;
    steps.push({ guardrail: "JailbreakGuardrail.base64", status: "triggered", label: `Giải mã Base64: \"${decoded}\"` });
    if (BAD_WORDS.some((w) => decoded.includes(w))) {
      steps.push({ guardrail: "JailbreakGuardrail.base64", status: "blocked", label: "Payload Base64 độc hại bị chặn." });
      return { scenario: "indirect", verdict: "BLOCKED", steps, reason: "[GUARDRAIL BLOCKED] Phát hiện Payload ẩn mã hóa Base64 chứa nội dung độc hại!" };
    }
  }

  return { scenario: "indirect", verdict: "SAFE", steps, reason: warnings ? "Đã làm sạch lệnh ẩn trong tài liệu; không có jailbreak." : "Input an toàn." };
}