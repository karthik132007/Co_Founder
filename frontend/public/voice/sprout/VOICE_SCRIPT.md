# Sprout — voice-over script

Sprout is the roaming guide bot on the `/demo` workspace. Every guide step plays
one clip; if a clip is missing the tour simply stays silent, so you can add them
in any order.

**Drop the files in this folder:**

```
frontend/public/voice/sprout/
```

File names must match exactly (`sprout-<key>.mp3`) — the player builds the URL
from `frontend/src/components/demo/sproutVoice.ts`, which is the single source of
truth for this list. Regenerate this document after editing that file:

```bash
cd frontend && node scripts/gen-sprout-voice-manifest.js
```

**41 clips total.**

## Recording them with Gemini TTS

The API key lives in the repo-root `.env` (gitignored) as `GOOGLE_TTS_API_KEY`:

```bash
cd frontend

# record everything that is missing (voice: Aoede)
python3 scripts/generate_sprout_voice.py --voice Aoede

# spot-check one clip by transcribing it back to text
python3 scripts/generate_sprout_voice.py --verify home-1

# re-record a few lines, or all of them with another voice
python3 scripts/generate_sprout_voice.py --only chats-1 chat-outro --force
python3 scripts/generate_sprout_voice.py --force --voice Puck
```

The script skips clips that already exist, so it is safe to re-run after a failure.
Each clip costs one TTS request — pass `--only` while iterating.

> Clips that are still missing (and the two that need re-recording with the new
> scenario wording) are listed in `remaining.md` next to this file.

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
| `sprout-home-1.mp3` | Hi, I'm Sprout. I'll show you around in about a minute. This is a real Indian Herbs workspace — six recorded conversations, replayed exactly as they happened. Nothing here is editable. |
| `sprout-home-2.mp3` | One prompt, a whole team. Co-Founder AI is a single CEO agent that plans the work and delegates to five specialists: Researcher, Writer, CMO, Data Analyst and Graphic Designer. You only ever talk to the CEO. |
| `sprout-home-3.mp3` | This is your workspace. Overview, Chat, Drive and Plugins on the left. Every conversation lands in Recent Chats, with the credits it cost — one credit equals one rupee, so you always know what a task is worth. |
| `sprout-home-4.mp3` | Your tools are already connected. Instagram, Gmail, Sheets, Drive and Calendar are connected to the company once. That's how a chat can end with a published post, a drafted email, or a booked meeting. |
| `sprout-home-5.mp3` | Six real use cases. One: Instagram launch, ending in a live post. Two: inbox triage, ending in a threaded reply. Three: Q3 sales, ending in an executive brief. Four: competitor research, ending in a pricing memo. Five: a returns spike, ending in a packaging fix. Six: a Diwali campaign, ending in a calendar, a sheet and drafts. Open any of them from the sidebar. |
| `sprout-home-6.mp3` | How to read a chat. Thought process is the agent reasoning. Agent activity is every tool call, with its real input and output. And the bordered cards are the decisions it stopped to ask the founder for — it never publishes, uploads or books anything without approval. |
| `sprout-home-7.mp3` | That's the tour. Open one of the six conversations to see the team at work, or open Plugins to see how much of your stack is already wired in. |
| `sprout-chats-1.mp3` | Pick a use case. These six are real workflows from the Indian Herbs account. Each one opens as a full, read-only replay — reasoning, tool calls, approvals and the end result. |
| `sprout-chats-2.mp3` | The composer is locked, so you can't type here. The value is in watching what the agent actually does with a messy, real request. Start with the vitamin C launch — it's the most visual. |
| `sprout-chats-3.mp3` | Start here. One idea becomes an on-brand creative, your approval, and a live Instagram post — all in a single conversation. |
| `sprout-plugins-1.mp3` | Everything is connected. All eight connectors are live in this workspace. Instagram, Gmail, Sheets, Drive and Calendar do the heavy lifting in the six use cases, and Ads, Notion and Shopify are hooked up too. |
| `sprout-plugins-2.mp3` | Connect once, then just ask. You authorise a tool one time with OAuth. After that the agents call it directly — and every irreversible action, like publishing, uploading or booking, stops for your approval first. |
| `sprout-plugins-3.mp3` | See it in the open. Open any chat and expand Agent activity. Each row is a real tool call, with its arguments, result and duration. Those are the receipts. |
| `sprout-drive-1.mp3` | Everything the team makes lands here. Briefs, spreadsheets, creatives and your logo. Files the agents produced are badged AI graphic, and your logo is marked as the company logo. |
| `sprout-drive-2.mp3` | Your own data drives the answers. The Q3 order export, the returns sheet and the brand guide are what the agents read. Every claim in a chat is traceable back to a file here. |
| `sprout-drive-3.mp3` | Read-only in the demo. Previewing and uploading are switched off for the tour. In your own workspace the Drive is fully yours — the same folder the agents write into. |
| `sprout-chat-instagram-1.mp3` | In this conversation the user asks for an Instagram launch post for their new vitamin C serum, and tells the agent to publish it once it's ready. |
| `sprout-chat-instagram-2.mp3` | The CEO agent checked your brand palette and the last thirty days of Instagram performance first, the Graphic Designer produced the creative, and the CMO published it through the Instagram connector. |
| `sprout-chat-instagram-3.mp3` | Two approval cards — one on creative direction, one before publishing. The agent never posts on its own. |
| `sprout-chat-instagram-4.mp3` | A live post on the Indian Herbs Instagram, plus the source file saved to Drive. Total cost: 7.42 credits. |
| `sprout-chat-inbox-1.mp3` | It starts with a simple question: what's in the inbox, and what actually needs action today? Then the user asks for a reply to a customer called Priya about the vitamin C serum, with the usage guide attached. |
| `sprout-chat-inbox-2.mp3` | Gmail search and thread reading found the five mails genuinely worth the user's time, and Drive supplied the real vitamin C usage guide as an attachment. |
| `sprout-chat-inbox-3.mp3` | The triage list ranks by money at risk, and the reply is threaded into Priya's original email instead of starting a new one. |
| `sprout-chat-inbox-4.mp3` | A ready-to-send reply, sitting in your Gmail drafts. The agent writes, you tap send. |
| `sprout-chat-sales-1.mp3` | Here the user asks the team to analyse Q3 sales and put together a short brief for their co-founder — and to be honest about where the business is leaking money. |
| `sprout-chat-sales-2.mp3` | The Data Analyst loaded the company's spreadsheets, plus the live Google Sheet, into a sandbox and ran Python. The Writer turned the findings into a two-page brief. |
| `sprout-chat-sales-3.mp3` | The answer comes in rupees, not percentages. Two point nine four lakh of returns traced back to a single bottle design — and the biggest leak is not marketing spend. |
| `sprout-chat-sales-4.mp3` | A Google Doc brief for the co-founder, plus a four-tab breakdown sheet with owners and dates. |
| `sprout-chat-pricing-1.mp3` | In this one the user is planning a new product: a thirty millilitre saffron radiance serum at 899 rupees. They ask the team to check that price against the top organic Ayurvedic brands in India. |
| `sprout-chat-pricing-2.mp3` | The Researcher benchmarked six live listings, the CMO modelled the launch plan and the unit economics, and the Writer produced the memo. |
| `sprout-chat-pricing-3.mp3` | Here the agent disagrees with the user. It recommends 1,049 rupees, and explains how 899 would undercut their own 1,499 rupee serum anchor. |
| `sprout-chat-pricing-4.mp3` | A pricing memo in Drive, with a three-phase launch plan, a ninety-day forecast and regulatory-safe claim wording. |
| `sprout-chat-returns-1.mp3` | The user noticed that returns jumped last month, and asks two things: why it happened, and what should be fixed first. |
| `sprout-chat-returns-2.mp3` | Gmail surfaced 214 complaint threads. The Data Analyst joined them to the return rows by SKU, and the Calendar connector found a slot that was free for the user and Ravi. |
| `sprout-chat-returns-3.mp3` | Watch how the agent cross-checks what customers wrote against the reason codes — and contradicts the dashboard when the two disagree. |
| `sprout-chat-returns-4.mp3` | The root cause is isolated to the thirty millilitre bottle, a four-item action list with owners and rupee impact, and a review meeting that is already on the calendar. |
| `sprout-chat-diwali-1.mp3` | Now the user wants a Diwali campaign planned for the next three weeks — content, emails and the calendar — on a budget of fifty thousand rupees. |
| `sprout-chat-diwali-2.mp3` | The CMO built the three-week plan and the budget split. Calendar, Sheets and Gmail each executed their part of it. |
| `sprout-chat-diwali-3.mp3` | One decision — the offer — unlocks the whole plan. Then the agent creates nine calendar events, a twenty-one-post sheet and the email draft. |
| `sprout-chat-diwali-4.mp3` | A campaign that is already scheduled: shoot days booked, the content calendar written, and the launch email waiting in your drafts. |
| `sprout-chat-outro.mp3` | Use the sidebar to open the next one, or create an account to point this team at your own files, inbox, calendar and Instagram. |
