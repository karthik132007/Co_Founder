#!/usr/bin/env node
/**
 * Regenerates the Sprout voice-over deliverables from the single source of
 * truth (`src/components/demo/sproutVoice.ts`):
 *
 *   public/voice/sprout/manifest.json  — machine-readable list for batch TTS tools
 *   public/voice/sprout/VOICE_SCRIPT.md — human-readable script + audio specs
 *
 * Run from `frontend/`:  node scripts/gen-sprout-voice-manifest.js
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceFile = path.join(root, "src/components/demo/sproutVoice.ts");
const outDir = path.join(root, "public/voice/sprout");

const source = fs.readFileSync(sourceFile, "utf8");
const anchor = source.indexOf("export const SPROUT_LINES");
if (anchor === -1) throw new Error("SPROUT_LINES not found in sproutVoice.ts");

const objectStart = source.indexOf("{", anchor);
const objectEnd = source.indexOf("\n};", objectStart);
if (objectEnd === -1) throw new Error("Could not find the end of SPROUT_LINES");

// The literal is plain JSON-compatible text authored in this repo.
const lines = eval(`(${source.slice(objectStart, objectEnd + 2)})`);

const dir = source.match(/SPROUT_VOICE_DIR = "([^"]+)"/)?.[1] ?? "/voice/sprout";
const clips = Object.entries(lines).map(([key, text]) => ({
  key,
  file: `sprout-${key}.mp3`,
  url: `${dir}/sprout-${key}.mp3`,
  text,
}));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify(
    {
      generatedFrom: "frontend/src/components/demo/sproutVoice.ts",
      howToRunIt: "Every clip is played by the roaming demo bot on the matching guide step.",
      audioSpec: {
        format: "mp3",
        sampleRateHz: 44100,
        channels: 1,
        bitrateKbps: 96,
        loudnessLufs: -16,
        peakCeilingDbfs: -3,
        trailingSilenceMs: 250,
      },
      clipCount: clips.length,
      clips,
    },
    null,
    2,
  ) + "\n",
);

const table = clips
  .map((c) => `| \`${c.file}\` | ${c.text.replace(/\|/g, "\\|")} |`)
  .join("\n");

/**
 * Clips that are already recorded but no longer match the script (rewritten
 * wording, or an old product name). Empty right now — `chats-2`,
 * `chat-instagram-1` and `chat-inbox-1` were re-recorded on 2026-09-22.
 * Add an entry here whenever a recorded line changes.
 */
const RERECORD = {};

fs.writeFileSync(
  path.join(outDir, "VOICE_SCRIPT.md"),
  `# Sprout — voice-over script

Sprout is the roaming guide bot on the \`/demo\` workspace. Every guide step plays
one clip; if a clip is missing the tour simply stays silent, so you can add them
in any order.

**Drop the files in this folder:**

\`\`\`
frontend/public/voice/sprout/
\`\`\`

File names must match exactly (\`sprout-<key>.mp3\`) — the player builds the URL
from \`frontend/src/components/demo/sproutVoice.ts\`, which is the single source of
truth for this list. Regenerate this document after editing that file:

\`\`\`bash
cd frontend && node scripts/gen-sprout-voice-manifest.js
\`\`\`

**${clips.length} clips total.**

## Recording them with Gemini TTS

The API key lives in the repo-root \`.env\` (gitignored) as \`GOOGLE_TTS_API_KEY\`:

\`\`\`bash
cd frontend

# record everything that is missing (voice: Aoede)
python3 scripts/generate_sprout_voice.py --voice Aoede

# spot-check one clip by transcribing it back to text
python3 scripts/generate_sprout_voice.py --verify home-1

# re-record a few lines, or all of them with another voice
python3 scripts/generate_sprout_voice.py --only chats-1 chat-outro --force
python3 scripts/generate_sprout_voice.py --force --voice Puck
\`\`\`

The script skips clips that already exist, so it is safe to re-run after a failure.
Each clip costs one TTS request — pass \`--only\` while iterating.

> Clips that are still missing (and the two that need re-recording with the new
> scenario wording) are listed in \`remaining.md\` next to this file.

## Voice direction

- Warm, friendly, lightly upbeat product-guide voice — think a calm tutorial
  host, not a radio ad. Mid-20s to mid-30s.
- Neutral Indian English (the workspace is an Indian company: Indian Herbs).
- Around 145–160 words per minute, natural sentence pauses, no shouting.
- No music, no jingle, no intro/outro sound effects — voice only.
- Read the text exactly as written; don't add words like "Welcome to…".
- Keep the energy consistent across clips: they play back-to-back in one tour.

## Audio spec

| Setting | Value |
|---|---|
| Format | MP3 |
| Sample rate | 44.1 kHz |
| Channels | Mono |
| Bitrate | 96 kbps (CBR) |
| Loudness | about −16 LUFS, peak ≤ −3 dBFS |
| Trailing silence | ≤ 250 ms |

## Script

| File | Line |
|---|---|
${table}
`,
);

/* ── remaining.md — exactly what still has to be recorded ── */

const missing = clips.filter((c) => !fs.existsSync(path.join(outDir, c.file)));
const stale = clips
  .filter((c) => RERECORD[c.key] && fs.existsSync(path.join(outDir, c.file)))
  .map((c) => ({ ...c, reason: RERECORD[c.key] }));
/** One block per clip — the file name above the line, so it is easy to copy. */
const rows = (list) =>
  list
    .map((c) => `**\`${c.file}\`**\n\n> ${c.text.replace(/\n/g, " ")}\n`)
    .join("\n");
const staleRows = (list) =>
  list
    .map((c) => `**\`${c.file}\`** — ${c.reason}\n\n> ${c.text.replace(/\n/g, " ")}\n`)
    .join("\n");

fs.writeFileSync(
  path.join(outDir, "remaining.md"),
  `# Sprout — still to record

Generated from \`frontend/src/components/demo/sproutVoice.ts\` by
\`node scripts/gen-sprout-voice-manifest.js\` — re-run it after adding clips and
this list updates itself.

**${clips.length - missing.length} of ${clips.length} clips are in place. ${missing.length} missing.**

Drop each file into \`frontend/public/voice/sprout/\` with the exact name below.
Nothing else is needed: the demo player probes for the file and starts using it.

## Missing (${missing.length})

${rows(missing) || "Nothing left — the whole pack is recorded.\n"}
${stale.length ? `
## Already recorded — please re-record (${stale.length})

These clips exist, but the audio no longer matches the script (the lines were
rewritten to explain the scenario, and/or they still say "Kumkumadi", which is
now the Vitamin C Serum). Same file names, so just overwrite them:

${staleRows(stale)}
\`\`\`bash
cd frontend
python3 scripts/generate_sprout_voice.py --only ${stale.map((c) => c.key).join(" ")} --force
\`\`\`
` : ""}
## Specs

- MP3 · 44.1 kHz · mono · 96 kbps · −16 LUFS · peak ≤ −3 dBFS · ≤ 250 ms tail
- Voice: warm, friendly, lightly upbeat; neutral Indian English; ~150 wpm
- No music, no intro/outro stings — the lines play back-to-back in one tour

Full script, including the clips already recorded, lives in \`VOICE_SCRIPT.md\`.
`,
);

console.log(
  `Wrote ${clips.length} clips to ${path.relative(root, outDir)} ` +
    `(${missing.length} still missing${stale.length ? `, ${stale.length} to re-record` : ""})`,
);
