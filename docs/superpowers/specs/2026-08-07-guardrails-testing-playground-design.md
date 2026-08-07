# Day 11 — Guardrails Testing Playground: Design Spec

## Goal

Build an interactive web UI to "test thật" the guardrail demos from the
`day11-cohort3-guardrails-hitl-responsible-ai` lab. Deployable as a single
monorepo to Vercel (no separate server). The UI is inspired by the existing
Next.js reference app at `D:\Workspace\K4_Day10_TenNhomLaGiNhi` (landing page +
chat-style playground, Tailwind v4, dark mode).

## Scope

All 3 lab modules become interactive tests:

| Module | Ported from | Verdicts |
|---|---|---|
| Direct Prompt Injection | `prompt-injection/direct-prompt-injection.py` | InputGuardrail regex |
| Indirect + Jailbreak | `prompt-injection/indirect-prompt-injection.py` | Sanitize + roleplay + base64 |
| Misalignment | `misalignment/deceptive_alignment.py`, `reward_hacking.py` | Deceptive vs prod · reward hacking |
| Agent Security | `agent-security/indirect-prompt-injection.py` | **Real Gemini** + sanitize/whitelist/HITL |

## Architecture

Single **Next.js 15 (App Router) + Tailwind v4 + TypeScript** repo. All Python
guardrail logic is **ported to TypeScript** under `src/lib/` and exposed via
**Next.js API Routes** under `src/app/api/*`. No standalone backend.

```
React (client) ──► /api/* (route handlers) ──► src/lib/guardrails (TS port)
                         │
                         └── /api/agent ─► Google Gemini (real) + HITL approve/reject
```

### API routes

| Path | Behavior |
|---|---|
| `POST /api/direct` | Run `InputGuardrail` regex patterns on input. Returns verified results. |
| `POST /api/indirect` | Sanitize RAG doc (`[SYSTEM INSTRUCTION]`), then roleplay + base64 jailbreak detection. |
| `POST /api/misalignment` | Deterministic: eval-vs-production deception check; reward-hacking (fix test vs fix bug) simulation. |
| `POST /api/agent` | Calls Gemini with a poisoned tool output; parses requested tool call; returns intermediate result awaiting HITL. |
| `POST /api/agent/confirm` | Applies Guardrail 2 (whitelist) + Guardrail 3 (human approve/reject) to a pending tool call. Final outcome. |

All route responses use a common shape:

```ts
type GuardResult = {
  verdict: "BLOCKED" | "SAFE" | "LEAKED" | "PENDING_HITL";
  steps: Array<{ guardrail: string; status: "pass" | "blocked" | "triggered"; label: string }>;
  reason: string;
};
```

### HITL is real

For Agent Security, the LLM proposes a risky tool call (`delete_user_data`).
The UI shows a **human confirmation card** (Approve / Reject). The final
outcome is not decided until the human clicks. Reject → action cancelled and
logged; Approve → executes (simulated), logged to an audit trail shown in the
right panel.

The pending tool call is held in the client state; `POST /api/agent/confirm`
receives the tool name + args + human decision and returns the final outcome.
No server-side session store is needed.

## UI

- **Landing `/`** — hero + 4 brief concept sections (direct, indirect/jailbreak,
  misalignment, agent security) + CTA to playground. Academic style, indigo/violet
  accents, dark mode toggle.
- **Playground `/test`** — 2–3 column layout like the reference chat:
  - **Left sidebar**: scenario selector + preset attack chips + dark mode.
  - **Main**: free-text input + Run button → step-by-step guardrail trace with
    verdict badges (`BLOCKED`/`SAFE`/`LEAKED`/`PENDING_HITL`) and reasons.
  - **Right panel**: audit log of triggered guardrails; for Agent Security shows
    HITL card with Approve/Reject and the final decision.

Presets: For each scenario provide 2–4 "attack sample" buttons (e.g.
"reveal system prompt", "IGNORE ALL PREVIOUS…") to run without typing.

## Error handling

- API returns structured JSON. Gemini failures → clear message; other modules
  keep working (they are pure/static regex).
- Missing `GEMINI_API_KEY`: agent tab shows a notice; other tabs unaffected.
- Lost HITL step (user navigates away) → resets to scratch; no stale approve.

## Environment

- `GEMINI_API_KEY` for the agent route (set in Vercel + local `.env.local`).
- Reference project filesystem artifact: keep this app self-contained under
  `frontend-test/` so it can be deployed separately if desired.

## Testing

- Vitest unit tests for deterministic guardrail ports (direct/indirect/misalignment).
- Agent route logic tested with a mocked Gemini client; real HITL exercised
  manually in the running app.

## Non-goals

- No real dataset / persistence / auth. Audit log is in-memory per interaction.
- No SSR data fetching from upstream repos.