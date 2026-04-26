// Converts text to speech using the ElevenLabs API (REST fetch — no SDK
// streaming complexity needed for this demo). Returns a loaded HTMLAudioElement
// so the caller can cancel playback at any time with audio.pause().
export async function speakText(text: string): Promise<HTMLAudioElement> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error(
      "VITE_ELEVENLABS_API_KEY or VITE_ELEVENLABS_VOICE_ID not set in .env.local",
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  // Free memory when playback ends naturally
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  return audio;
}
