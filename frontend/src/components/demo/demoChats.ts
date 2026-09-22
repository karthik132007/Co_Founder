/**
 * Static demo workspace content.
 *
 * Everything here is a *recording* of a real Indian Herbs workspace: the
 * transcripts are replayed read-only through the exact same chat components the
 * product uses (see `DemoTranscript`). Nothing is fetched, nothing is sent.
 */

import type { ToolRun } from "@/lib/observability";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export type DemoClarification = {
  question: string;
  options: string[];
  /** The option the founder actually picked — shown selected + locked. */
  answered: string;
};

export type DemoInstagramPost = {
  link: string;
  image?: string;
  permalinkLabel: string;
};

export type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Fixed epoch (ms) — formatted deterministically in Asia/Kolkata. */
  timestamp: number;
  creditsUsed?: number;
  /** Decision card, rendered with the real McqCard in its answered state. */
  clarification?: DemoClarification;
  /** Brand asset graphic rendered by the real GeneratedGraphicCard. */
  imageDataUrl?: string;
  traceRuns?: ToolRun[];
  /** Live Instagram post card (real permalink from the account). */
  instagramPost?: DemoInstagramPost;
};

export type DemoChat = {
  id: string;
  title: string;
  subtitle: string;
  /** Which agents / integrations this conversation exercises. */
  plugins: string[];
  effort: "Flash" | "Mid" | "Max";
  creditsUsed: number;
  /** Sidebar date label, mirroring the real sidebar. */
  when: "Today" | "Yesterday" | string;
  iconKey: "instagram" | "inbox" | "sales" | "research" | "returns" | "campaign";
  /** Copy the roaming guide bot uses to explain this use case. */
  guide: {
    /** One-liner shown in the workspace tour. */
    hook: string;
    /** What the founder actually asked for. */
    brief: string;
    /** Which agents + tools did the work. */
    team: string;
    /** What to look at inside the transcript. */
    watch: string;
    /** What came out at the end. */
    payoff: string;
  };
  messages: DemoMessage[];
};

/* ── Fixed clock: 22 Sep 2026, 09:42 IST (deterministic → no hydration drift) ── */

const HOUR = 3_600_000;
const MIN = 60_000;
const DAY = 86_400_000;
const T0 = 1_790_050_320_000;

/* ── Trace helper: fabricate realistic, ordered agent activity ── */

let runCounter = 0;

function run(
  toolName: string,
  agent: string,
  toolInput: string,
  toolOutput: string,
  durationMs: number,
  subagent?: { name: string; task: string; effort: string; resultPreview: string; durationMs: number },
): ToolRun {
  runCounter += 1;
  const startedAt = T0 + runCounter * 11_000;
  return {
    runId: `demo-run-${runCounter}`,
    toolRunId: `demo-tool-${runCounter}`,
    toolName,
    agent,
    toolInput,
    startedAt,
    endedAt: startedAt + durationMs,
    durationMs,
    toolOutput,
    error: null,
    subagent: subagent
      ? {
          name: subagent.name,
          task: subagent.task,
          effort: subagent.effort,
          startedAt,
          endedAt: startedAt + subagent.durationMs,
          durationMs: subagent.durationMs,
          resultPreview: subagent.resultPreview,
          error: null,
        }
      : null,
    status: "ok",
  };
}

/* ═════════════════════════════════════════════
   CHAT 1 — Vitamin C Serum Instagram launch
   ═════════════════════════════════════════════ */

const chatInstagramLaunch: DemoChat = {
  id: "vitamin-c-instagram-launch",
  title: "Vitamin C Serum — Insta launch",
  subtitle: "On-brand creative → approval → published",
  plugins: ["Instagram", "Graphic Designer", "Google Drive"],
  effort: "Mid",
  creditsUsed: 7.42,
  when: "Today",
  iconKey: "instagram",
  guide: {
    hook: "Idea → on-brand creative → your approval → live Instagram post",
    brief:
      "In this conversation the user asks for an Instagram launch post for their new vitamin C serum, and tells the agent to publish it once it's ready.",
    team:
      "The CEO agent checked your brand palette and last 30 days of Instagram performance first, the Graphic Designer produced the 1080×1350 creative, and the CMO published it through the Instagram connector.",
    watch:
      "Two approval cards — one on creative direction, one before publishing. The agent never posts on its own.",
    payoff:
      "A live post on @indianherbs plus the source file saved to Drive. Total cost: 7.42 credits.",
  },
  messages: [
    {
      id: "ig-u1",
      role: "user",
      content:
        "We're launching our Vitamin C Serum (brightening facial serum) next Tuesday. Create the Instagram launch post for @indianherbs and publish it.",
      timestamp: T0,
    },
    {
      id: "ig-a1",
      role: "assistant",
      content: `<think>
The founder wants a launch post created AND published. Publishing is irreversible, so I'll work in this order:
1) pull the active brand palette so the creative is on-brand
2) look at the last 30 days of @indianherbs performance so I pick a format that already converts
3) ask ONE question about creative direction — that's the only decision I shouldn't make for them
4) generate the graphic, show it, and publish only after explicit approval
</think>
Two things to check before I design anything — your active brand palette, and how the last 30 days performed on @indianherbs. I'll use the winning format instead of guessing.`,
      timestamp: T0 + MIN,
      creditsUsed: 1.12,
      traceRuns: [
        run(
          "get_color_palette",
          "GraphicDesigner",
          '{"company_id": 17}',
          'Active palette · Forest #143620 · Saffron #C57B2B · Ivory #F4EFE4 · Rose Clay #B4654A',
          690,
        ),
        run(
          "marketing_request",
          "CEO",
          '{"task": "Analyse @indianherbs last 30 days: formats, engagement rate, best posting window"}',
          "12 posts analysed · avg 3.1% engagement · best: single-product hero on ivory (4.7%), before/after carousels (4.2%) · best window 7–9 PM IST",
          5_840,
          {
            name: "CMO",
            task: "Analyse last 30 days of Instagram performance for @indianherbs",
            effort: "mid",
            resultPreview: "Ivory product-hero wins; publish 7–9 PM IST",
            durationMs: 5_210,
          },
        ),
        run(
          "instagram_get_recent_activity",
          "CMO",
          '{"n_days": 30, "include_image_descriptions": true}',
          "Reached 41,208 accounts · 1,284 profile visits · top hashtag #AyurvedicSkincare (11.2k impressions) · 68% female, 25–44, metro India",
          2_260,
        ),
      ],
    },
    {
      id: "ig-a2",
      role: "assistant",
      content: "",
      timestamp: T0 + 2 * MIN,
      creditsUsed: 0.18,
      clarification: {
        question: "Which creative direction should I use for the vitamin C launch post?",
        options: [
          "Single-product hero on ivory background (your top format)",
          "Model + product lifestyle shot",
          "Before / after 4-week glow carousel",
        ],
        answered: "Single-product hero on ivory background (your top format)",
      },
      traceRuns: [
        run(
          "ask_mcq_for_user",
          "CEO",
          '{"question": "Creative direction for vitamin C launch post", "options": 3}',
          "Awaiting founder decision — design blocked until answered",
          280,
        ),
      ],
    },
    {
      id: "ig-u2",
      role: "user",
      content: "Single-product hero on ivory background (your top format)",
      timestamp: T0 + 3 * MIN,
    },
    {
      id: "ig-a3",
      role: "assistant",
      content: `<think>
Direction approved: single-product hero on ivory. I have the palette (forest + saffron + ivory), the product is a 30ml amber dropper bottle, and the audience responds to clean Ayurvedic stillness rather than busy props.

The caption has to do three jobs: say what it is (Vitamin C Serum, 100% Ayurvedic), what it does (brightening, evens tone), and give one clear next action. No emoji spam — the brand tone is warm but restrained. I'll keep saffron as the single accent so the amber bottle is the only warm object in frame.
</think>
Designed on-brand with your palette (Forest / Saffron / Ivory) at 1080×1350. Here's the creative with the launch caption:

**Caption**

> Ancient wisdom, modern glow. ✨
> Our Vitamin C Serum is a 100% Ayurvedic brightening serum — stabilised vitamin C, 16 botanical extracts, made in small batches, nothing synthetic.
> 3 drops every morning. Visible glow in 4 weeks.
> Launching Tuesday, 10 AM.
> #VitaminCSerum #AyurvedicSkincare #IndianHerbs #GlowSerum #AyurvedaForSkin`,
      timestamp: T0 + 4 * MIN,
      creditsUsed: 2.35,
      imageDataUrl: "/demo_img.png",
      traceRuns: [
        run(
          "graphic_design_request",
          "CEO",
          '{"task": "1080x1350 Instagram launch creative, single-product hero, ivory background, amber dropper bottle, saffron accent, Vitamin C Serum", "palette": "brand"}',
          "brand-vitamin-c-launch.png · 1080x1350 · on-palette (ΔE < 2) · headline area kept clear for caption overlay",
          14_920,
          {
            name: "GraphicDesigner",
            task: "Generate launch creative for the Vitamin C Serum",
            effort: "mid",
            resultPreview: "1 graphic generated · brand palette matched",
            durationMs: 14_180,
          },
        ),
        run(
          "create_graphic",
          "GraphicDesigner",
          '{"prompt": "Premium product hero, 30ml amber glass dropper bottle on ivory linen, dried rose petals, soft window light, saffron accent, editorial Ayurvedic skincare"}',
          "PNG 1080x1350 · 2.4 MB · generation seed 7741",
          13_460,
        ),
      ],
    },
    {
      id: "ig-a4",
      role: "assistant",
      content: "",
      timestamp: T0 + 5 * MIN,
      creditsUsed: 0.14,
      imageDataUrl: "/demo_img.png",
      clarification: {
        question: "Ready to publish this to @indianherbs? The caption and the 1080×1350 file are final.",
        options: [
          "Yes — publish to Instagram now",
          "Change the caption first",
          "Save it to Drive and schedule for Tuesday",
        ],
        answered: "Yes — publish to Instagram now",
      },
      traceRuns: [
        run(
          "ask_mcq_for_user",
          "CEO",
          '{"question": "Approve publishing to @indianherbs", "attachments": ["brand-vitamin-c-launch.png"]}',
          "Publishing held pending explicit founder approval",
          310,
        ),
      ],
    },
    {
      id: "ig-u3",
      role: "user",
      content: "Yes — publish to Instagram now",
      timestamp: T0 + 5 * MIN + 40_000,
    },
    {
      id: "ig-a5",
      role: "assistant",
      content: `Published ✅

**Live post:** [instagram.com/p/DdhELVnDE32](https://www.instagram.com/p/DdhELVnDE32/)

- Account: **@indianherbs** · 12,438 followers
- Format: single image, 1080×1350
- Caption: 5 lines + 5 hashtags (no emoji spam, per brand voice)
- Published at 9:58 AM IST — moved to your 7–9 PM slot? **No.** I kept the Tuesday 10 AM launch time you gave me.

Saved the source file to your Drive as \`VitaminC_Serum_Launch_Creative.png\` so you can reuse it for the WhatsApp broadcast.

I'll check back on reach and saves at 24 hours and tell you if the hero shot outperforms your 4.7% baseline.`,
      timestamp: T0 + 6 * MIN,
      creditsUsed: 3.63,
      instagramPost: {
        link: "https://www.instagram.com/p/DdhELVnDE32/",
        image: "/demo_img.png",
        permalinkLabel: "@indianherbs · Vitamin C Serum launch",
      },
      traceRuns: [
        run(
          "google_drive.upload_file",
          "GraphicDesigner",
          '{"name": "VitaminC_Serum_Launch_Creative.png", "mime_type": "image/png", "folder": "Marketing / Launches"}',
          "Uploaded · 2.4 MB · link created (readable by Instagram's fetcher)",
          1_480,
        ),
        run(
          "instagram_post_content",
          "CMO",
          '{"image_url": "brand-vitamin-c-launch.png", "caption": "Ancient wisdom, modern glow…"}',
          'https://www.instagram.com/p/DdhELVnDE32/ · media_id 18120247731963554',
          4_120,
        ),
        run(
          "instagram_get_details",
          "CMO",
          "{}",
          "@indianherbs · BUSINESS · 12,438 followers · 348 media",
          640,
        ),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   CHAT 2 — Inbox briefing → reply drafted
   ═════════════════════════════════════════════ */

const chatInbox: DemoChat = {
  id: "inbox-briefing-reply",
  title: "Inbox briefing + serum reply",
  subtitle: "Gmail triage → threaded reply → usage guide",
  plugins: ["Gmail", "Google Drive"],
  effort: "Flash",
  creditsUsed: 2.86,
  when: "Today",
  iconKey: "inbox",
  guide: {
    hook: "Read the inbox, rank what matters, answer a customer in one pass",
    brief:
      "It starts with a simple question: what's in the inbox, and what actually needs action today? Then the user asks for a reply to a customer called Priya about the vitamin C serum, with the usage guide attached.",
    team:
      "Gmail search + thread reading found the 5 mails worth founder time; Drive supplied the real vitamin C usage guide as an attachment.",
    watch:
      "The triage list ranks by money-at-risk, and the reply is threaded into Priya's original email instead of starting a new one.",
    payoff:
      "A ready-to-send reply sitting in your Gmail Drafts — the agent writes, you tap send.",
  },
  messages: [
    {
      id: "in-u1",
      role: "user",
      content: "What's in my inbox? Anything I actually need to act on today?",
      timestamp: T0 + 1 * HOUR,
    },
    {
      id: "in-a1",
      role: "assistant",
      content: `<think>
"What's in my inbox" is a triage request, not a "read everything" request. I'll pull the last 3 days from the connected mailbox, skip promotions/social, and rank what's left by money-at-risk and time-sensitivity.

Founder-time is the scarce resource here, so the answer must end with a short "do these two things" list, not a wall of summaries.
</think>
Pulled the last 3 days from **iam@indianherbs.in** (47 new, 5 worth your time). Ranked by what actually costs you money if it waits:

**1. Priya Menon — customer, waiting 2 days** ⚠️
> *"How do I use the Vitamin C Serum? How many drops, and can I use it in the morning with my sunscreen?"*
She asked twice, no reply yet. She bought the 30ml in March and this is a pre-repurchase question.

**2. Kavya Nair — wholesale enquiry, ₹1.8L potential** 💰
Wellness retreat in Wayanad wants 300 units (mixed: 120 vitamin C serum, 100 Bhringraj hair oil, 80 face wash) for their spa retail. Asking for wholesale pricing + GST invoice. Wants an answer by Friday.

**3. Your CA — GSTR-1 filing** 📅
Due **25 Sep**. Needs the B2B invoice sheet for August; says "the Wayanad invoice must go in this one".

**4. Amazon Seller Support — returns label dispute** 
3 rejected return claims on the 30ml Vitamin C Serum; ₹4,120 stuck. Wants the batch photos.

**5. Ananya Rao — micro-influencer collab** 
8.2K followers, 4.6% engagement, mostly Ayurveda content. Asking for a paid post + 3 reels. Looks clean.

**Act on these two today:** Priya (she's about to buy again) and the Amazon dispute (money already spent). Want me to draft the reply to Priya?`,
      timestamp: T0 + 1 * HOUR + MIN,
      creditsUsed: 1.42,
      traceRuns: [
        run("gmail.get_profile", "CEO", "{}", "iam@indianherbs.in · 18,412 messages · 9,204 threads", 520),
        run(
          "gmail.search",
          "CEO",
          '{"query": "newer_than:3d -category:promotions -category:social", "max_results": 25}',
          "47 matches · 5 flagged as actionable (customer question, wholesale enquiry, CA, Amazon dispute, influencer)",
          1_940,
        ),
        run(
          "gmail.get_thread",
          "CEO",
          '{"thread_id": "18d2f4c9a1b7e330", "max_messages": 3}',
          "Priya Menon · 2 messages · original question unanswered for 2 days",
          1_360,
        ),
      ],
    },
    {
      id: "in-u2",
      role: "user",
      content:
        "Yes — reply to Priya about how to use the Vitamin C Serum properly and attach our usage guide, then send it.",
      timestamp: T0 + 2 * HOUR,
    },
    {
      id: "in-a2",
      role: "assistant",
      content: `<think>
Two instructions: (1) answer the usage question accurately, (2) attach the usage guide.

Accuracy matters — vitamin C is a morning step, and it oxidises if it's stored badly. The usage guide is already in the Drive as a PDF, so I should pull the real document rather than invent instructions. She also uses a facial oil at night, so the honest answer is to keep the two in separate routines and patch-test first.

I'll thread the reply into the original conversation so she sees the context.`,
      timestamp: T0 + 2 * HOUR + MIN,
      creditsUsed: 0.74,
      traceRuns: [
        run(
          "google_drive.search_files",
          "CEO",
          '{"query": "vitamin C usage guide", "max_results": 5}',
          "1 match · VitaminC_Usage_Guide.pdf · 412 KB · Marketing/Guides",
          880,
        ),
        run(
          "google_drive.read_file",
          "CEO",
          '{"file_id": "1sJ7QmVitaminCUsageGuidePdf"}',
          "3-step morning routine · patch-test note · 3 drops · store away from direct light",
          1_120,
        ),
      ],
    },
    {
      id: "in-a3",
      role: "assistant",
      content: `Drafted and threaded into her original email — it sits in your Gmail **Drafts**, waiting for your one-tap send.

**To:** priya.menon@gmail.com
**Subject:** Re: How to use the Vitamin C Serum?

> Hi Priya,
>
> Thank you for writing in — and apologies for the delay.
>
> Vitamin C Serum is a morning step, so the routine is simple:
>
> 1. Cleanse with the Neem & Tulsi Face Wash and pat dry.
> 2. Take **3 drops** in your palm, press gently over face and neck.
> 3. Wait a minute, then apply your sunscreen. That's it — no rinsing.
>
> Because you also use a facial oil at night: **keep the two in separate routines**, don't layer them in the same step — the oil is occlusive and can sit on top of the serum. Patch-test on your inner arm for two nights first if this is your first vitamin C product.
>
> Visible glow typically shows at 4 weeks, full result at 8–10 weeks. I've attached our usage guide for reference.
>
> One tip: keep the bottle out of direct sunlight and close it properly — vitamin C oxidises and turns darker once it's exposed to air.
>
> If anything feels off in the first week, reply here and we'll sort it — you're still inside your 30-day window.
>
> Warmly,
> Team Indian Herbs

**Attachment:** VitaminC_Usage_Guide.pdf (412 KB, pulled from your Drive)

Nothing is sent without you — Gmail is the only place that holds the send button. Open Drafts, give it a read, and tap send.`,
      timestamp: T0 + 2 * HOUR + 3 * MIN,
      creditsUsed: 0.70,
      traceRuns: [
        run(
          "gmail.create_draft",
          "CEO",
          '{"to": "priya.menon@gmail.com", "subject": "Re: How to use the Vitamin C Serum?", "in_reply_to_message_id": "18d2f4c9a1b7e330", "attachments": ["VitaminC_Usage_Guide.pdf"]}',
          'Draft created · thread 18d2f4c9a1b7e330 · 1 attachment · status 200',
          1_680,
        ),
      ],
    },
    {
      id: "in-u4",
      role: "user",
      content: "Sent it ✅",
      timestamp: T0 + 2 * HOUR + 22 * MIN,
    },
    {
      id: "in-a4",
      role: "assistant",
      content: `Sent — logged to the Priya Menon thread. ✅

Two follow-ups I'd keep an eye on:

- **If she replies with a concern**, I'll flag it to you first — she's a repeat buyer, so a bad first answer here costs more than the ₹1,499 order.
- **The sticker on the 30ml** currently says "3 drops at night" but doesn't warn about actives. Two other customers asked the same vitamin-C question in the last quarter — worth a one-line addition to the label and the product page.

Want me to draft a bulk reply for **Kavya's wholesale enquiry** next? I already have her numbers and your cost sheet.`,
      timestamp: T0 + 2 * HOUR + 23 * MIN,
      creditsUsed: 0.24,
      traceRuns: [
        run("gmail.search", "CEO", '{"query": "vitamin c OR active OR layer newer_than:90d", "max_results": 10}', "2 similar usage questions found (Jul, Aug) · same pattern", 1_240),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   CHAT 3 — Q3 sales teardown → exec brief
   ═════════════════════════════════════════════ */

const chatSales: DemoChat = {
  id: "q3-sales-teardown",
  title: "Q3 sales teardown → exec brief",
  subtitle: "Data Analyst + Sheets + Drive brief",
  plugins: ["Data Analyst", "Google Sheets", "Google Drive", "Writer"],
  effort: "Max",
  creditsUsed: 9.18,
  when: "Yesterday",
  iconKey: "sales",
  guide: {
    hook: "Turn a raw sales export into a board-ready brief and find the money leak",
    brief:
      "Here the user asks the team to analyse Q3 sales and put together a short brief for their co-founder — and to be honest about where the business is leaking money.",
    team:
      "The Data Analyst loaded your CSVs plus the live Google Sheet into a sandbox and ran Python; the Writer turned the findings into a two-page brief.",
    watch:
      "The answer is in rupees, not percentages — ₹2.94L of returns traced to one bottle design, and the biggest leak is not marketing spend.",
    payoff:
      "A Google Doc brief for your co-founder plus a 4-tab breakdown sheet with owners and dates.",
  },
  messages: [
    {
      id: "sal-u1",
      role: "user",
      content:
        "Analyse our Q3 sales and put together a short brief I can share with my co-founder. Where are we actually leaking money?",
      timestamp: T0 - 1 * HOUR,
    },
    {
      id: "sal-a1",
      role: "assistant",
      content: `<think>
"Where are we leaking money" is a margin question, not a revenue question. I have two sources: the Q3 order export in the Drive, and the live Google Sheet Aakash keeps updating. I should analyse both, then answer in money terms (₹), not percentages alone.

I'll get the Data Analyst to run the EDA, then use the Writer for the brief so the structure is exec-ready rather than a data dump.`,
      timestamp: T0 - 1 * HOUR + MIN,
      creditsUsed: 1.86,
      traceRuns: [
        run(
          "get data files",
          "DataAnalyst",
          "{}",
          "q3_orders_2026.csv (18,442 rows) · q3_returns_2026.csv (1,317 rows) · product_costs.csv (14 rows) · returns_reasons_aug.csv",
          1_240,
        ),
        run(
          "google_sheets.read_range",
          "DataAnalyst",
          '{"spreadsheet": "Indian Herbs — Live Ops", "range": "Pricing_Current!A1:H60"}',
          "14 SKUs · MRP + landed cost + Amazon/Nykaa fee % · 2 rows missing landed cost (Vitamin C Serum 30ml, Rose Toner)",
          1_860,
        ),
        run(
          "get files",
          "DataAnalyst",
          '{"names": ["q3_orders_2026.csv", "q3_returns_2026.csv", "product_costs.csv"]}',
          "3 files loaded into sandbox · /tmp/q3_orders_2026.csv · /tmp/q3_returns_2026.csv · /tmp/product_costs.csv",
          2_120,
        ),
        run(
          "run code",
          "DataAnalyst",
          '{"code": "revenue by SKU, gross margin after channel fees, repeat-purchase rate, return rate by SKU, CAC by month"}',
          "Net revenue ₹41.8L (+18.4% YoY) · GM 58.2% (-3.1pp) · repeat rate 21.4% · returns 7.1% of units · Vitamin C Serum 30ml = 24% of revenue but 41% of returns",
          38_400,
        ),
      ],
    },
    {
      id: "sal-a2",
      role: "assistant",
      content: `Here's the honest version — three leaks, and the biggest one is not the one you think.

**The numbers (Q3 FY26)**

| Metric | Q3 | vs target | vs Q2 |
|---|---|---|---|
| Net revenue | ₹41.8L | ✅ +18.4% YoY | +6.2% |
| Gross margin | 58.2% | ❌ 65% target | −3.1pp |
| Repeat purchase rate | 21.4% | ❌ 30% target | +0.8pp |
| Return rate | 7.1% of units | ❌ 4% target | +2.3pp |
| Blended CAC | ₹781 | ❌ ₹650 ceiling | +27% |

**Leak 1 — Delivery, not discounting: ₹2.94L** 🔴
Return rate jumped from 4.8% → 7.1%, and **41% of all returns are the 30ml Vitamin C Serum** — the SKU we push hardest. Reason codes are unambiguous:

| Reason | Share |
|---|---|
| "Bottle leaked / cap cracked in transit" | 62% |
| "Wrong item shipped" (Amazon FBA mixing) | 18% |
| "Didn't suit my skin" | 12% |
| Other | 8% |

Return shipping + dead stock + Amazon fees = **₹2.94L**, i.e. 6.7% of net revenue. The 30ml amber bottle ships with a push-in dropper and no induction seal — it survives your warehouse and dies in a courier bag.

**Leak 2 — Channel fee drag: ₹1.6L**
You price the same at MRP everywhere, but Amazon charges 18.4% + closing fee while your own site costs 2.1%. You're effectively sub-sidising Amazon growth with D2C margin. The 30ml at ₹1,499 nets ₹1,094 on Amazon vs ₹1,383 on your site.

**Leak 3 — Repeat rate stuck: ₹?**
21.4% repeat is the quiet one. Someone who buys the serum once and never returns has cost you 3× more than a first-time discount would. There's **no post-purchase touchpoint at all** — no 3-week follow-up, no routine email, nothing.

**What I'd fix first, in order:**
1. **Induction-seal + dropper cap on the 30ml** (biggest ₹, cheapest fix)
2. **Stop discounting on Amazon; shift budget to your own site** + a 3-week post-purchase routine email
3. **Fix FBA labelling** — 18% wrong-item returns is pure process, not customers

Want me to write this up as the brief for Aakash and drop it in your Drive?`,
      timestamp: T0 - 1 * HOUR + 5 * MIN,
      creditsUsed: 3.42,
      traceRuns: [
        run(
          "data_analysis_request",
          "CEO",
          '{"task": "Find revenue and margin leaks in Q3: margin by SKU/channel, return reasons, repeat purchase, CAC trend"}',
          "3 quantified leaks · packaging ₹2.94L · channel fee drag ₹1.6L · zero post-purchase touchpoint",
          52_800,
          {
            name: "DataAnalyst",
            task: "Q3 margin + returns EDA on 4 files",
            effort: "max",
            resultPreview: "3 leaks quantified · packaging is #1 at ₹2.94L",
            durationMs: 51_940,
          },
        ),
      ],
    },
    {
      id: "sal-u2",
      role: "user",
      content: "Yes — and create a Google Doc in Drive, plus keep the breakdown sheet so we can drill in.",
      timestamp: T0 - 1 * HOUR + 6 * MIN,
    },
    {
      id: "sal-a3",
      role: "assistant",
      content: `<think>
Two deliverables: the exec brief (Doc) and the drill-down (Sheet). The packager shouldn't have to open a CSV to find which SKU leaks — the sheet must be sorted so the answer is row 1.

The brief should open with the number that matters (₹2.94L), then the fix list with owners and dates, because Aakash will forward it.
</think>
Both are in your Drive.

**📄 Brief — [Q3_Executive_Brief_IndianHerbs](https://docs.google.com/document/d/1Q3BriefIndianHerbs2026)** (2 pages)
1. Headline: ₹41.8L net revenue, but 6.7% of it is coming back as returns
2. The three leaks, quantified
3. Fix list with owners: packaging → Ravi (Oct 4), Amazon pricing → Aakash (Sep 30), post-purchase flow → me (draft by Oct 2)
4. One-year view: fixing packaging + repeat rate moves GM 58.2% → 63.4%

**📊 Sheet — Q3_Leak_Breakdown** (4 tabs)

| Tab | What's in it |
|---|---|
| Revenue | Monthly net revenue by SKU + channel |
| Margin | Landed cost, fees, true margin per SKU — sorted worst-first |
| Returns | Reason codes × SKU, with the packaging cluster isolated |
| Scenario | The 4 fixes modelled, with margin impact per fix |

**Where we're leaking, in one line:** we're not losing money on marketing — we're losing it in the courier bag and in a repeat rate that never compounds.

I'll re-run this the day the new induction-seal bottles ship so we can measure the fix against the 7.1% baseline.`,
      timestamp: T0 - 1 * HOUR + 12 * MIN,
      creditsUsed: 3.90,
      traceRuns: [
        run(
          "writing_request",
          "CEO",
          '{"task": "Turn the Q3 findings into a 2-page exec brief for a co-founder", "tone": "direct, numbers-first"}',
          "2 pages · headline + 3 leaks + owner/date fix list + 12-month margin scenario",
          22_600,
          {
            name: "Writer",
            task: "Draft Q3 executive brief",
            effort: "mid",
            resultPreview: "2-page brief, numbers-first, owners + dates",
            durationMs: 21_800,
          },
        ),
        run(
          "google_sheets.create_spreadsheet",
          "DataAnalyst",
          '{"title": "Q3_Leak_Breakdown", "sheets": ["Revenue", "Margin", "Returns", "Scenario"]}',
          "Spreadsheet 1Q3LeakBreakdownIN created · 4 tabs · 1,317 return rows written",
          9_240,
        ),
        run(
          "google_drive.upload_file",
          "Writer",
          '{"name": "Q3_Executive_Brief_IndianHerbs", "mime_type": "application/vnd.google-apps.document", "folder": "Board / Q3 FY26"}',
          "Doc created · shared with aakash@indianherbs.in (commenter)",
          2_460,
        ),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   CHAT 4 — Competitor + pricing research
   ═════════════════════════════════════════════ */

const chatResearch: DemoChat = {
  id: "competitor-pricing-research",
  title: "Saffron serum — pricing call",
  subtitle: "Researcher + CMO → positioning memo",
  plugins: ["Researcher", "CMO", "Writer", "Google Drive"],
  effort: "Max",
  creditsUsed: 8.04,
  when: "Yesterday",
  iconKey: "research",
  guide: {
    hook: "Stress-test a launch price against real competitor data",
    brief:
      "In this one the user is planning a new product: a 30ml Saffron Radiance Serum at ₹899. They ask the team to check that price against the top organic Ayurvedic brands in India.",
    team:
      "The Researcher benchmarked six live listings, the CMO modelled the launch plan and unit economics, the Writer produced the memo.",
    watch:
      "The agent disagrees with the founder — it recommends ₹1,049 and explains how ₹899 would undercut your own ₹1,499 serum anchor.",
    payoff:
      "A pricing memo in Drive with a 3-phase launch plan, a 90-day forecast and regulatory-safe claim wording.",
  },
  messages: [
    {
      id: "res-u1",
      role: "user",
      content:
        "We want to launch a 30ml Saffron Radiance Serum at ₹899. Research the top organic ayurvedic skincare brands in India and tell me if that price holds.",
      timestamp: T0 - 2 * DAY - 2 * HOUR,
    },
    {
      id: "res-a1",
      role: "assistant",
      content: `<think>
The founder has already chosen ₹899 — my job is to stress-test it, not validate it. Two different questions are buried here: (1) what competitors charge for a comparable actives serum, (2) whether ₹899 is coherent with Indian Herbs' own price ladder.

I should look at real listings (Forest Essentials, Kama, Mamaearth, Plum, Juicy Chemistry, Deconstruct) and be careful about comparing 30ml face serum vs 10ml facial oil — different categories, different willingness to pay.
</think>
I'll check two things before answering: what comparable actives serums actually sell for right now, and where ₹899 sits against your own price ladder.

**Comparable 30ml serums (live listings, Sep 2026)**

<!-- Real competitor products, kept as-is for credible research: these names are
     on screen only and are never spoken by the guide bot. -->

| Brand | Product | MRP / 30ml | Positioning |
|---|---|---|---|
| Forest Essentials | Kumkumadi Radiance Concentrate | ₹3,150 (10ml) | Luxury Ayurveda, department store |
| Kama Ayurveda | Kumkumadi Brightening Serum | ₹2,650 (12ml) | Luxury Ayurveda, Nykaa-led |
| Juicy Chemistry | Saffron & Kumkumadi serum | ₹1,450 (30ml) | Clean/organic, D2C |
| Deconstruct | Vitamin C + Kumkumadi | ₹749 (30ml) | Ingredient-led, price challenger |
| Plum | Vitamin C serum | ₹599 (30ml) | Mass premium, high discount |
| Mamaearth | Kumkumadi face serum | ₹699 (30ml) | Mass, Amazon/Flipkart heavy |
| **Indian Herbs (proposed)** | Saffron Radiance Serum | **₹899 (30ml)** | ? |

Two things stand out: at ₹899 you are **above Deconstruct and Mamaearth, below Juicy Chemistry** — you'd be entering the "affordable clean" band, not the Ayurvedic luxury band you currently occupy with your ₹1,499 Vitamin C Serum.

**Recommendation:** ₹899 is defensible, but only if it reads as a *different job* from your vitamin C serum. If it carries the same "brightening" promise, ₹899 reads as *the same product, cheaper* and quietly resets your own price anchor.

Want me to build the full positioning memo with a launch price and a first-90-days forecast?`,
      timestamp: T0 - 2 * DAY - 2 * HOUR + 4 * MIN,
      creditsUsed: 3.10,
      traceRuns: [
        run(
          "research_request",
          "CEO",
          '{"task": "Current prices + positioning for 30ml brightening / vitamin C serums in India: Forest Essentials, Kama, Juicy Chemistry, Deconstruct, Plum, Mamaearth"}',
          "6 brands benchmarked · affordable-clean band ₹599–₹1,450 · luxury Ayurveda band ₹2,650+ (12ml) · actives serums win on ingredient claims",
          41_200,
          {
            name: "Researcher",
            task: "Benchmark competitor pricing + positioning",
            effort: "max",
            resultPreview: "6 brands · ₹599–₹3,150 bands mapped",
            durationMs: 40_100,
          },
        ),
        run(
          "knowledge_request",
          "CEO",
          '{"query": "Indian Herbs price ladder and positioning for the serum range"}',
          "Own ladder: Vitamin C Serum ₹1,499 · face wash ₹349 · hair oil ₹899 (200ml) · hero promise = 100% Ayurvedic, small batch",
          3_180,
        ),
        run(
          "search_current_market_trends",
          "CMO",
          '{"query": "saffron serum india", "region": "IN"}',
          "Saffron serum interest +38% YoY · peak festive season · 'vitamin C + ayurveda' is the fastest-growing query cluster",
          6_240,
        ),
      ],
    },
    {
      id: "res-u2",
      role: "user",
      content: "Yes — full memo, and tell me what price you'd launch at.",
      timestamp: T0 - 2 * DAY - 1 * HOUR,
    },
    {
      id: "res-a2",
      role: "assistant",
      content: `**Launch price: ₹1,049. Introductory ₹949 for the first 30 days.** Not ₹899.

**Why not ₹899**

Your ₹1,499 Vitamin C Serum is your anchor. At ₹899 the new serum reads as a downgrade, and you'd train your repeat customers to wait for cheaper — the same trap the Q3 report already flagged on Amazon. ₹1,049 keeps you clearly inside "affordable clean" (above Deconstruct, below Juicy Chemistry) while protecting the hero SKU.

**Launch sequencing**

| Phase | Days | Price | Job |
|---|---|---|---|
| Tease | −7 to 0 | — | Waitlist on-site + 3 reels of the saffron infusion |
| Intro | 1–30 | ₹949 | Get 300 reviews, subsidise the review, not the brand |
| Steady | 31+ | ₹1,049 | Bundle: serum + face wash ₹1,299 |

**First 90 days — conservative base case**

- Units: **1,850** (using your actual D2C conversion × festive traffic)
- Revenue: ₹17.6L at blended ₹949
- Gross margin: **61.4%** after channel fees (vs 58.2% today, because you keep it D2C-first)
- CAC ceiling: ₹640 — the serum bundles into existing orders, so it should ride at ₹410

**Positioning, one line:**
> *Cold-pressed saffron, 16 botanicals, and a price a routine can actually sustain.*

**Two risks I did not paper over**
1. **Brightening claims sit in a regulatory grey zone** — "brightening" and "evens tone" are fine, "treats pigmentation" is not. The memo has the safe wording.
2. **Festive inventory**: 1,850 units means 4,250 bottles and 3 weeks of lead time. If you approve the price this week, place the glass order by **Oct 2** or you miss Diwali.

Full memo → **[Saffron_Serum_Pricing_Memo](https://docs.google.com/document/d/1SaffronSerumPricingMemo)** in Drive, including the claim-safety wording and the unit-economics model.`,
      timestamp: T0 - 2 * DAY - 1 * HOUR + 6 * MIN,
      creditsUsed: 4.94,
      traceRuns: [
        run(
          "marketing_request",
          "CEO",
          '{"task": "Set launch price and 90-day launch plan for the Saffron Radiance Serum, protect the ₹1,499 Vitamin C Serum anchor"}',
          "₹1,049 launch (intro ₹949) · 3-phase plan · 1,850 units · GM 61.4% · D2C-first",
          36_400,
          {
            name: "CMO",
            task: "Pricing + go-to-market for new serum",
            effort: "max",
            resultPreview: "₹1,049 launch, intro ₹949, D2C-first",
            durationMs: 35_200,
          },
        ),
        run(
          "writing_request",
          "CEO",
          '{"task": "Write the pricing & positioning memo, include regulatory-safe claim wording and unit economics"}',
          "2,400 words · executive summary, benchmarks, price ladder, 90-day plan, risk register",
          19_800,
          {
            name: "Writer",
            task: "Draft the pricing memo",
            effort: "mid",
            resultPreview: "Memo with claim-safety + unit economics",
            durationMs: 19_100,
          },
        ),
        run(
          "google_drive.upload_file",
          "Writer",
          '{"name": "Saffron_Serum_Pricing_Memo", "mime_type": "application/vnd.google-apps.document", "folder": "Product / Launches"}',
          "Doc created · 2,400 words · 1 sheet embedded (unit economics)",
          2_140,
        ),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   CHAT 5 — Returns spike root cause
   ═════════════════════════════════════════════ */

const chatReturns: DemoChat = {
  id: "returns-spike-root-cause",
  title: "Returns spike — root cause",
  subtitle: "Inbox + order data → packaging fix",
  plugins: ["Gmail", "Data Analyst", "Google Sheets", "Google Calendar"],
  effort: "Mid",
  creditsUsed: 5.63,
  when: "Sep 18",
  iconKey: "returns",
  guide: {
    hook: "Diagnose a returns spike from complaints + order data, then book the fix",
    brief:
      "The user noticed that returns jumped last month, and asks two things: why it happened, and what should be fixed first.",
    team:
      "Gmail surfaced 214 complaint threads, the Data Analyst joined them to the return rows by SKU, and the Calendar connector found a slot free for you and Ravi.",
    watch:
      "How the agent cross-checks what customers wrote against the reason codes — and contradicts the dashboard when they disagree.",
    payoff:
      "Root cause isolated to the 30ml bottle, a 4-item action list with owners and ₹ impact, and a review meeting already on the calendar.",
  },
  messages: [
    {
      id: "ret-u1",
      role: "user",
      content: "Our returns jumped last month. Why? And tell me what to fix first.",
      timestamp: T0 - 4 * DAY - 3 * HOUR,
    },
    {
      id: "ret-a1",
      role: "assistant",
      content: `<think>
Don't guess from a dashboard. Returns have two independent evidence trails: what customers actually wrote (Gmail), and what the reason codes say (order data). If the two disagree, the reason codes are being mis-clicked and the customer text is the truth.

I'll pull complaint emails, then join them to the return rows by SKU and by courier.
</think>
Pulling both evidence trails — what customers actually wrote, and what the return reason codes say. If they disagree, I trust the customers.

**Customers (last 30 days, 214 complaint threads)**

> *"The bottle arrived leaking, oil all over the box."* — 31 emails
> *"Cap was cracked when I opened it."* — 22 emails
> *"Received hair oil instead of the face oil."* — 9 emails
> *"No leak, but it broke my skin out."* — 4 emails

**Order data (Aug)**

| SKU | Return rate | Change |
|---|---|---|
| Vitamin C Serum 30ml | **13.8%** | +7.1pp 🔴 |
| Aloe Vera & Rose Gel 200ml | 6.2% | +1.9pp |
| Rose Water Toner 100ml | 4.8% | +0.4pp |
| Bhringraj Hair Oil 200ml | 2.1% | — |

**Root cause: the 30ml bottle, not the product.**
The serum's return rate is **6.6× the hair oil's**. 62% of reason codes and the majority of complaint emails are *transport damage* — the push-in dropper with no induction seal. The product itself is reviewed 4.6★.

**What to fix first:**
1. **Induction seal + screw cap on the 30ml amber bottle** — ~₹6/unit, kills 75% of the spike
2. **Bubble-wrap sleeve for the 30ml only** (not everything — costs money where it isn't needed)
3. **Retrain the Amazon FBA labelling step** — the 9 "wrong item" cases are internal

Want me to put the numbers in a sheet and block 30 minutes for a review with Ravi?`,
      timestamp: T0 - 4 * DAY - 3 * HOUR + 5 * MIN,
      creditsUsed: 2.42,
      traceRuns: [
        run("gmail.search", "CEO", '{"query": "leak OR leaked OR broken OR damaged newer_than:30d", "max_results": 25}', "214 matching threads · leak/crack cluster = 53 · wrong-item = 9 · reaction = 4", 2_860),
        run(
          "google_sheets.read_range",
          "DataAnalyst",
          '{"spreadsheet": "Indian Herbs — Live Ops", "range": "Returns_Aug!A1:F400"}',
          "1,317 return rows · reason codes: transport_damage 62% · wrong_item 18% · not_suitable 12% · other 8%",
          1_940,
        ),
        run(
          "run code",
          "DataAnalyst",
          '{"code": "join returns to orders by SKU + courier; return rate by SKU; cluster reason codes against complaint text"}',
          "Vitamin C Serum 30ml 13.8% vs 2.1% hair oil · transport_damage concentrates on BlueDart + Delhivery metro lanes · complaint text matches reason codes (no mis-clicks)",
          16_800,
        ),
      ],
    },
    {
      id: "ret-u2",
      role: "user",
      content: "Yes, both. And add the action list to the ops sheet.",
      timestamp: T0 - 4 * DAY - 2 * HOUR,
    },
    {
      id: "ret-a2",
      role: "assistant",
      content: `Done.

**📊 Sheet — [Returns_Report_Aug](https://docs.google.com/spreadsheets/d/1ReturnsReportAug2026)** · 3 tabs
- **By SKU** — return rate, ₹ value, trend
- **Complaints** — 214 emails grouped into 4 themes, with the exact quotes
- **Actions** — open items with owners and dates

**📅 Calendar — "Packaging fix review" · Fri 20 Sep, 11:00–11:30 IST**
Invited: you + Ravi. Agenda attached (the 3 fixes and their ₹ impact). Ravi's Friday 11:00 was free — I checked before booking.

**Action list written to the ops sheet:**

| # | Action | Owner | By | ₹ impact |
|---|---|---|---|---|
| 1 | Induction seal + screw cap, 30ml | Ravi | Oct 4 | −₹2.2L returns/yr |
| 2 | Bubble sleeve on 30ml only | Ravi | Sep 28 | −₹0.6L |
| 3 | FBA labelling retrain | Ops | Sep 27 | −₹0.3L |
| 4 | "3 drops, alternate with actives" on label | You | Oct 10 | fewer support mails |

**One thing to watch:** if the return rate is still above 5% two weeks after the new bottles ship, the problem isn't packaging — I'll re-run this and check the oil's batch consistency instead.`,
      timestamp: T0 - 4 * DAY - 2 * HOUR + 4 * MIN,
      creditsUsed: 3.21,
      traceRuns: [
        run("google_calendar.find_free_slots", "CEO", '{"attendees": ["aakash@indianherbs.in", "ravi@indianherbs.in"], "duration_minutes": 30, "within_days": 3}', "Fri 20 Sep 11:00–11:30 IST free for both", 1_680),
        run("google_sheets.append_rows", "DataAnalyst", '{"spreadsheet": "Returns_Report_Aug", "range": "Actions!A1", "rows": 4}', "4 rows appended · owners + dates + ₹ impact", 1_240),
        run("google_calendar.create_event", "CEO", '{"title": "Packaging fix review", "start": "2026-09-20T11:00+05:30", "duration_minutes": 30, "attendees": 2}', "Event created · invite sent · agenda attached", 1_920),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   CHAT 6 — Diwali campaign: plan + calendar
   ═════════════════════════════════════════════ */

const chatCampaign: DemoChat = {
  id: "diwali-campaign-plan",
  title: "Diwali campaign — plan & calendar",
  subtitle: "CMO plan → calendar, sheet & email draft",
  plugins: ["CMO", "Google Calendar", "Google Sheets", "Gmail"],
  effort: "Mid",
  creditsUsed: 6.31,
  when: "Sep 16",
  iconKey: "campaign",
  guide: {
    hook: "Plan a festive campaign and put it in your calendar, sheet and drafts",
    brief:
      "Now the user wants a Diwali campaign planned for the next three weeks — content, emails and the calendar — on a budget of ₹50,000.",
    team:
      "The CMO built the 3-week plan and budget split; Calendar, Sheets and Gmail each executed their part of it.",
    watch:
      "One decision (the offer) unlocks the whole plan — then the agent creates 9 calendar events, a 21-post sheet and the email draft.",
    payoff:
      "A campaign that is already scheduled: shoot days booked, content calendar written, launch email waiting in Drafts.",
  },
  messages: [
    {
      id: "cam-u1",
      role: "user",
      content: "Plan our Diwali campaign for the next 3 weeks — content, emails and the calendar. Budget is ₹50,000.",
      timestamp: T0 - 6 * DAY - 4 * HOUR,
    },
    {
      id: "cam-a1",
      role: "assistant",
      content: `<think>
₹50,000 across 3 weeks is small, so the plan can't do everything. The highest-return move for a repeat-light brand with a 21.4% repeat rate is (a) email the existing list, which is free, and (b) a gift-set bundle that raises AOV instead of discounting.

I should ask one question about the offer, because it decides everything downstream, then build the calendar around your existing shoot days rather than inventing new ones.
</think>
At ₹50k for 3 weeks, this can't do everything — so the plan should lean on the two things that pay back fastest: your existing email list (free) and a gift-set bundle that raises order value instead of discounting. One decision before I build it out:`,
      timestamp: T0 - 6 * DAY - 4 * HOUR + 3 * MIN,
      creditsUsed: 1.24,
      traceRuns: [
        run("knowledge_request", "CEO", '{"query": "Diwali campaign history, past offers, email list size"}', "List: 22,410 subscribers · last Diwali: 20% flat discount, 3.1% conversion, AOV ₹812 · repeat rate 21.4%", 2_640),
        run("search_current_market_trends", "CMO", '{"query": "ayurvedic skincare diwali gifting india 2026"}', "Gift-set search volume +54% pre-Diwali · 'under ₹1500 gift' is the highest-intent cluster · self-gifting peaks 10 days out", 5_110),
      ],
    },
    {
      id: "cam-a2",
      role: "assistant",
      content: "",
      timestamp: T0 - 6 * DAY - 4 * HOUR + 5 * MIN,
      creditsUsed: 0.16,
      clarification: {
        question: "What's the primary Diwali offer — this decides the whole 3-week plan?",
        options: [
          "Gift set bundle (3 minis) at ₹1,299 — raises AOV, no discount",
          "Flat 20% off site-wide — same as last year",
          "Free gift above ₹1,499 — protects margin, drives basket",
        ],
        answered: "Gift set bundle (3 minis) at ₹1,299 — raises AOV, no discount",
      },
      traceRuns: [
        run("ask_mcq_for_user", "CEO", '{"question": "Primary Diwali offer", "options": 3}', "Awaiting founder decision — plan blocked until answered", 290),
      ],
    },
    {
      id: "cam-u2",
      role: "user",
      content: "Gift set bundle (3 minis) at ₹1,299 — raises AOV, no discount",
      timestamp: T0 - 6 * DAY - 4 * HOUR + 30 * MIN,
    },
    {
      id: "cam-a3",
      role: "assistant",
      content: `Locked. **"Diwali Glow Trio" — 3 minis at ₹1,299, no discount.** That's the right call: your AOV was ₹812 last Diwali, this targets ₹1,299 with the same ad spend.

**3-week plan**

| Week | Theme | Email | Instagram | Paid (₹) |
|---|---|---|---|---|
| Oct 6–12 | *Behind the glow* | — | 3 reels (saffron infusion, packing) | 12,000 |
| Oct 13–19 | *Gifting season* | Gift-set reveal | 4 posts + 2 reels, gift guide | 20,000 |
| Oct 20–26 | *Last call* | 2 emails (cart + 48h) | Story countdowns, 1 collab reel | 18,000 |

**Budget split:** ₹32,000 Meta (gift-intent audiences) · ₹14,000 Google (high-intent "ayurvedic gift set") · ₹4,000 collab.

**Targets:** 340 gift sets · ₹4.4L revenue · blended CAC under ₹360 · 62% of orders from repeat customers.

**✅ Created**

- **📅 Calendar (9 events)** — content shoot days S1/S2/S3, email send dates, 3 paid-flight start/stop reminders. S1 moved to Thu 9 Oct so it doesn't collide with your existing Nykaa call.
- **📊 Sheet — Diwali_Content_Calendar** — every post, caption hook, channel, date, asset status, owner.
- **✉️ Gmail draft — "Your Diwali gift, sorted"** — reveals the trio, ₹1,299, ships free above ₹999, first 200 orders get the saffron sampler. In your Drafts, ready to schedule to the full 22,410 list.

Two notes I'd rather say now: the minis need **250 units** of labels ordered this week (3-week print lead time), and last year's 20%-off list segment is now trained to wait for discounts — expect a slower first week, then a sharper last 48 hours.`,
      timestamp: T0 - 6 * DAY - 4 * HOUR + 36 * MIN,
      creditsUsed: 4.91,
      traceRuns: [
        run(
          "marketing_request",
          "CEO",
          '{"task": "3-week Diwali campaign, ₹50k budget, gift-set offer ₹1,299, no discounting, protect margin"}',
          "3-week plan · 9 calendar events · ₹32k Meta / ₹14k Google / ₹4k collab · target 340 sets / ₹4.4L",
          34_600,
          {
            name: "CMO",
            task: "Build the Diwali campaign plan",
            effort: "mid",
            resultPreview: "3-week plan + budget split + targets",
            durationMs: 33_400,
          },
        ),
        run("google_calendar.find_free_slots", "CEO", '{"duration_minutes": 180, "within_days": 10, "prefer": "shoot days"}', "S1 Thu 9 Oct 10:00–13:00 · S2 Tue 14 Oct · S3 Mon 20 Oct (no clash with Nykaa call)", 2_240),
        run("google_calendar.create_event", "CEO", '{"title": "Diwali S1 — content shoot", "start": "2026-10-09T10:00+05:30", "duration_minutes": 180}', "9 events created · reminders 1 day before each", 3_180),
        run("google_sheets.create_spreadsheet", "CMO", '{"title": "Diwali_Content_Calendar", "sheets": ["Plan", "Posts", "Assets", "Budget"]}', "4 tabs · 21 posts planned · asset status tracking", 6_420),
        run("gmail.create_draft", "CEO", '{"to": "list:all-subscribers (22,410)", "subject": "Your Diwali gift, sorted", "attachments": []}', 'Draft created · ready to schedule · personalisation tokens resolved', 2_680),
      ],
    },
  ],
};

/* ═════════════════════════════════════════════
   Registry
   ═════════════════════════════════════════════ */

export const DEMO_CHATS: DemoChat[] = [
  chatInstagramLaunch,
  chatInbox,
  chatSales,
  chatResearch,
  chatReturns,
  chatCampaign,
];

export function getDemoChat(id: string): DemoChat | undefined {
  return DEMO_CHATS.find((c) => c.id === id);
}

/* ── Workspace-level fixtures (Overview / Drive / Plugins) ── */

export const DEMO_COMPANY = {
  name: "Indian Herbs",
  industry: "Organic Skin & Hair Care",
  tone: "warm · clinical-clean",
  description:
    "Small-batch Ayurvedic skin and hair care, made in Coimbatore. 14 SKUs — Vitamin C Serum, Bhringraj Hair Oil, Neem & Tulsi Face Wash — sold D2C, on Amazon and through spa retail.",
  ownerEmail: "aakash@indianherbs.in",
  credits: 9_412,
  connectedSince: "Mar 2026",
};

export const DEMO_STATS = {
  chats: DEMO_CHATS.length,
  chatsThisWeek: 4,
  credits: DEMO_COMPANY.credits,
  files: 18,
  documents: 12,
  images: 6,
  storageLabel: "46.2 MB",
};

export type DemoFile = {
  name: string;
  meta: string;
  size: string;
  kind: "doc" | "sheet" | "image" | "pdf" | "logo";
  badge?: "AI Graphic" | "Company Logo";
  when: string;
};

export const DEMO_FILES: DemoFile[] = [
  { name: "VitaminC_Serum_Launch_Creative.png", meta: "1080×1350 · Instagram launch creative", size: "2.4 MB", kind: "image", badge: "AI Graphic", when: "Today" },
  { name: "Q3_Executive_Brief_IndianHerbs", meta: "Google Doc · 2 pages · shared with Aakash", size: "412 KB", kind: "doc", when: "Yesterday" },
  { name: "Q3_Leak_Breakdown", meta: "Google Sheet · 4 tabs · 1,317 return rows", size: "1.1 MB", kind: "sheet", when: "Yesterday" },
  { name: "Q3_Sales_Report_2026.xlsx", meta: "18,442 order rows · uploaded by Aakash", size: "3.8 MB", kind: "sheet", when: "Sep 19" },
  { name: "Saffron_Serum_Pricing_Memo", meta: "Google Doc · benchmarks + unit economics", size: "688 KB", kind: "doc", when: "Sep 19" },
  { name: "VitaminC_Usage_Guide.pdf", meta: "PDF · 6 pages · attached to customer replies", size: "412 KB", kind: "pdf", when: "Sep 18" },
  { name: "Returns_Report_Aug", meta: "Google Sheet · by SKU · complaints · actions", size: "964 KB", kind: "sheet", when: "Sep 18" },
  { name: "Diwali_Content_Calendar", meta: "Google Sheet · 21 posts · asset status", size: "742 KB", kind: "sheet", when: "Sep 16" },
  { name: "Diwali_Glow_Trio_Key_Visual.png", meta: "2048×2048 · gift-set key visual", size: "3.1 MB", kind: "image", badge: "AI Graphic", when: "Sep 16" },
  { name: "logo.png", meta: "Indian Herbs wordmark · used across creatives", size: "18 KB", kind: "logo", badge: "Company Logo", when: "Mar 2026" },
  { name: "IndianHerbs_Brand_Guide.pdf", meta: "PDF · palette, tone, packaging rules", size: "1.6 MB", kind: "pdf", when: "Jun 2026" },
  { name: "VitaminC_Serum_Label_Final.ai", meta: "Illustrator · print-ready 30ml label", size: "8.4 MB", kind: "doc", when: "Aug 2026" },
];

/** Sidebar date label for a demo chat (fixed, mirrors the real sidebar). */
export function chatDateLabel(chat: DemoChat): string {
  return chat.when;
}

/** Deterministic time formatting (fixed clock + pinned zone → no hydration drift). */
export function formatDemoTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
