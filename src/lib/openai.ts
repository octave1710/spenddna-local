// HACKATHON DEMO ONLY: dangerouslyAllowBrowser: true bypasses the OpenAI SDK
// guard that prevents API keys from being exposed in browser bundles.
// This is acceptable for a local, offline demo but MUST be replaced with a
// backend proxy (e.g. a Cloudflare Worker, edge function, or server route)
// before any production or public-facing deployment.
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "VITE_OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      );
    }
    _client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // HACKATHON ONLY — see comment above
    });
  }
  return _client;
}
