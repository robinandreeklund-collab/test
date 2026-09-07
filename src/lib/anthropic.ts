// Central Claude client helper. Used by bill extraction (Prompt 1) and the voice
// assistant. Inference is pinned to the EU region to honour "EU data only".
//
// Models: the repo standardises on claude-sonnet-5 for GiGi's AI (fast, cheap,
// strong at strict JSON — see CLAUDE.md). The assistant model is env-overridable.

export const EXTRACTION_MODEL = 'claude-sonnet-5';
export const ASSISTANT_MODEL = process.env.GIGI_ASSISTANT_MODEL || 'claude-sonnet-5';

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Single non-streaming text call with EU inference and refusal handling.
export async function claudeText(opts: {
  system: string;
  user: string;
  model: string;
  maxTokens?: number;
}): Promise<{ text: string; region: string }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();
  const region = process.env.ANTHROPIC_REGION || 'eu';

  // Built loosely so the newer top-level `inference_geo` param compiles across
  // SDK versions.
  const params: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 1024,
    inference_geo: region,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await client.messages.create(params as any);

  if (res?.stop_reason === 'refusal') {
    throw new Error('Claude declined this request.');
  }
  const block = (res.content as Array<{ type: string; text?: string }>).find((b) => b.type === 'text');
  return { text: block?.text ?? '', region: res?.usage?.inference_geo ?? region };
}
