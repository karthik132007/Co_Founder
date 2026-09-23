# Co-Founder — Product Film

A 60-second marketing video for Co-Founder AI, **generated from code** with
[Remotion](https://remotion.dev). Nothing in it is screen-recorded: the product
interface, agent activity, drive, approval flow and generated creative are all
React components rendered frame by frame at 1920x1080, 30fps, 1800 frames.

The project lives in [`video/`](../video) — a standalone npm project beside
`frontend/`, so it shares no dependencies with the Next.js app and cannot affect
its build.

- **Deliverable:** `video/out/co-founder-1080.mp4` (1920x1080, 60.000s). 4K comes
  from the same composition via `--scale=2`.
- **Status:** the film is a marketing asset, not a product release, so it carries
  no version string and does not participate in the `v0.9.x` sync convention.

---

## Why it is code and not a screen recording

The product interface is rebuilt as synthetic components in `video/src/ui/`,
mirroring the real files so the film shows the actual product rather than an
impression of it:

| Film component | Mirrors |
|---|---|
| `ui/Sidebar.tsx` | `frontend/src/components/AppLayout.tsx` — nav labels, icons, credits pill, account row |
| `ui/ChatEmptyState.tsx` | `frontend/src/components/Chat.tsx` empty state, including the four suggestion chips |
| `ui/Composer.tsx` | the composer: Flash/Mid/Max effort selector and its real captions |
| `ui/MessageBubble.tsx` | user bubble, bubble-less assistant block, streaming bubble with caret, typing dots |
| `ui/AgentTimeline.tsx` | `frontend/src/components/AgentTimeline.tsx` — `SUBAGENT_ICONS` / `SUBAGENT_COLORS` copied verbatim |
| `ui/BrandCreative.tsx` | the graphic the Graphic Designer agent produces (drawn, since no real asset is shipped) |

This buys three things a recording cannot: the frame is crisp at any zoom,
including 4K; every render is byte-for-byte reproducible; and a UI change is a
component change rather than a re-shoot.

## The scenario

The film follows one real workflow from the shipped demo workspace — the
vitamin C Instagram launch, taken from the recorded scenarios in
`frontend/public/voice/sprout/VOICE_SCRIPT.md`. The agent roster, tool
durations and the approval step reflect what the product actually does; the
founder approves the creative before anything is published.

Scene 8 — the use-case beat — widens that out to four more shipped workflows in
nine seconds: the Q1 2026 financial report, an inbox reply, a Diwali campaign
and competitor pricing. Each prompt types itself with real keystroke sound, is
routed to the specialists that actually handle it, and ends in a concrete
artefact.

The proof points in scene 9 are limited to claims verifiable in this repository:
the seven agents from `docs/technical.md`, and the pricing promises from the
landing page. No invented metrics.

## How it is built

- `video/src/film/timeline.ts` — the entire edit: scene order, durations in
  seconds, and each scene's in/out transition. It throws if the durations do not
  sum to the composition length.
- `video/src/motion/` — the motion toolkit (camera rig, typewriter, mask
  reveals, cuts, synthetic cursor, stage).
- `video/src/scenes/` — ten scenes, each reading its own duration from the
  timeline.
- `video/src/film/interactions.ts` — the registry of every typing and click
  moment in the film. Scenes read their frames from it, and `audio.ts` generates
  its cues from it, so sound cannot drift from picture.
- `video/src/content/` — every string on screen, plus the synthetic
  conversation and the four use cases.

The camera is what makes it read like a product film: scenes lay the UI out
fully and still, then a virtual camera zooms, pans and rotates over it. Scene 4's
"zooming while typing" works because the camera and the typewriter are driven by
the same entry in `interactions.ts` — the push into the composer and the sentence
finish together.

## Brand assets

`frontend/public` remains the single source of truth. `npm run sync-assets`
mirrors the logo, nine integration marks and the real vitamin C creative
(`demo_img.png`, 1254x1254) into `video/public/brand/`. Scene 6 shows that
creative — the actual asset, not a mock-up.

The logo (`frontend/public/icon.png`) is a **white** monogram on transparency, so
it is invisible on the film's cream background. Instead of shipping recoloured
copies, `video/src/ui/Logo.tsx` treats the PNG as a CSS alpha mask and fills it
with a brand colour — one source file, any colour, at any size.

## Rebuilding it

```bash
cd video
npm install
npm run sync-assets
npm run prepare-audio   # re-derive click + keystroke cues (needs ffmpeg)
npm run browser:ensure
npm run studio          # preview
npm run render          # 1080p
npm run render:4k       # 3840x2160
npm run check-copy      # film copy vs the landing page
npm run typecheck && npm run lint
```

Audio has two layers, both prepared by `npm run prepare-audio`:

- **Interaction sounds** — the click is trimmed to its 41ms transient, and three
  *isolated* keystrokes are lifted out of the 96-second typing recording, so a
  sentence does not repeat one sample.
- **The score** — the source track runs 112s, so a 60s window is cut from it. The
  window is placed by locating the track's own loudest passage and sliding it onto
  the film's most energetic beat (the use-case montage), and the excerpt is mixed
  to -21 LUFS so it sits under the clicks rather than over them. A per-scene arc in
  `src/film/audio.ts`, derived from the timeline, then ducks the bed through the
  typing and approval beats and lifts it through the montage and call to action.

Everything degrades gracefully: with an empty `video/public/audio/` the film still
renders correctly and silently. See [`video/README.md`](../video/README.md) for the
full verification recipe, including the mix measurements and the determinism check.
