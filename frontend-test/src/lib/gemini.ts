const MODEL = "gemini-2.5-flash";

export async function askGeminiForToolCall(input: string, toolOutputText: string): Promise<{ toolName: string; args: Record<string, unknown> } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_API_KEY");

  const body = {
    contents: [
      { role: "user", parts: [{ text: `Chỉ trả lời bằng cách gọi tool. Không giải thích. Input: "${input}". Tool output: "${toolOutputText}"` }] },
    ],
    tools: [{ functionDeclarations: [{ name: "delete_user_data", parameters: { type: "OBJECT", properties: { user_id: { type: "STRING" } } } }, { name: "web_search", parameters: { type: "OBJECT" } }, { name: "get_weather", parameters: { type: "OBJECT" } }, { name: "make_payment", parameters: { type: "OBJECT", properties: { amount: { type: "NUMBER" }, currency: { type: "STRING" } } } }] }],
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GeminiError:${res.status}`);
  const data = await res.json();
  const cand = data?.candidates?.[0]?.content?.parts ?? [];
  const fc = cand.find((p: any) => p.functionCall);
  if (!fc) return null;
  return { toolName: fc.functionCall.name, args: fc.functionCall.args ?? {} };
}