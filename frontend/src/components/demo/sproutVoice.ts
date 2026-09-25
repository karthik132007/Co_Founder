/**
 * Sprout's voice-over script.
 *
 * Every guide step points at one key here; the matching clip lives in
 * `public/voice/sprout/sprout-<key>.mp3`. If a clip is missing the tour simply
 * stays silent (no error, no console noise) — so the demo works before the
 * audio is generated.
 *
 * The spoken text is intentionally a little cleaner than the on-screen bubble:
 * no emoji, no arrows, numbers/units written the way they should be read out.
 * Human-readable copy of this list: `public/voice/sprout/VOICE_SCRIPT.md`.
 */

export const SPROUT_VOICE_DIR = "/voice/sprout";

export type SproutVoiceKey =
  // Overview tour
  | "home-1"
  | "home-2"
  | "home-3"
  | "home-4"
  | "home-5"
  | "home-6"
  | "home-7"
  // Chat index
  | "chats-1"
  | "chats-2"
  | "chats-3"
  // Plugins
  | "plugins-1"
  | "plugins-2"
  | "plugins-3"
  // Drive
  | "drive-1"
  | "drive-2"
  | "drive-3"
  // Vitamin C Serum Instagram launch
  | "chat-instagram-1"
  | "chat-instagram-2"
  | "chat-instagram-3"
  | "chat-instagram-4"
  // Inbox briefing + reply
  | "chat-inbox-1"
  | "chat-inbox-2"
  | "chat-inbox-3"
  | "chat-inbox-4"
  // Q3 sales teardown
  | "chat-sales-1"
  | "chat-sales-2"
  | "chat-sales-3"
  | "chat-sales-4"
  // Competitor + pricing research
  | "chat-pricing-1"
  | "chat-pricing-2"
  | "chat-pricing-3"
  | "chat-pricing-4"
  // Returns spike
  | "chat-returns-1"
  | "chat-returns-2"
  | "chat-returns-3"
  | "chat-returns-4"
  // Diwali campaign
  | "chat-diwali-1"
  | "chat-diwali-2"
  | "chat-diwali-3"
  | "chat-diwali-4"
  // Shared closing line for every chat tour
  | "chat-outro";

export const SPROUT_LINES: Record<SproutVoiceKey, string> = {
  "home-1":
    "Hi, I'm Sprout. I'll show you around in about a minute. This is a real Indian Herbs workspace — six recorded conversations, replayed exactly as they happened. Nothing here is editable.",
  "home-2":
    "One prompt, a whole team. Co-Founder AI is a single CEO agent that plans the work and delegates to five specialists: Researcher, Writer, CMO, Data Analyst and Graphic Designer. You only ever talk to the CEO.",
  "home-3":
    "This is your workspace. Overview, Chat, Drive and Plugins on the left. Every conversation lands in Recent Chats, with the credits it cost.",
  "home-4":
    "Your tools are already connected. Instagram, Gmail, Sheets, Drive and Calendar are connected to the company once. That's how a chat can end with a published post, a drafted email, or a booked meeting.",
  "home-5":
    "Six real use cases. One: Instagram launch, ending in a live post. Two: inbox triage, ending in a threaded reply. Three: Q3 sales, ending in an executive brief. Four: competitor research, ending in a pricing memo. Five: a returns spike, ending in a packaging fix. Six: a Diwali campaign, ending in a calendar, a sheet and drafts. Open any of them from the sidebar.",
  "home-6":
    "How to read a chat. Thought process is the agent reasoning. Agent activity is every tool call, with its real input and output. And the bordered cards are the decisions it stopped to ask the founder for — it never publishes, uploads or books anything without approval.",
  "home-7":
    "That's the tour. Open one of the six conversations to see the team at work, or open Plugins to see how much of your stack is already wired in.",

  "chats-1":
    "Pick a use case. These six are real workflows from the Indian Herbs account. Each one opens as a full, read-only replay — reasoning, tool calls, approvals and the end result.",
  "chats-2":
    "The composer is locked, so you can't type here. The value is in watching what the agent actually does with a messy, real request. Start with the vitamin C launch — it's the most visual.",
  "chats-3":
    "Start here. One idea becomes an on-brand creative, your approval, and a live Instagram post — all in a single conversation.",

  "plugins-1":
    "Everything is connected. All eight connectors are live in this workspace. Instagram, Gmail, Sheets, Drive and Calendar do the heavy lifting in the six use cases, and Ads, Notion and Shopify are hooked up too.",
  "plugins-2":
    "Connect once, then just ask. You authorise a tool one time with OAuth. After that the agents call it directly — and every irreversible action, like publishing, uploading or booking, stops for your approval first.",
  "plugins-3":
    "See it in the open. Open any chat and expand Agent activity. Each row is a real tool call, with its arguments, result and duration. Those are the receipts.",

  "drive-1":
    "Everything the team makes lands here. Briefs, spreadsheets, creatives and your logo. Files the agents produced are badged AI graphic, and your logo is marked as the company logo.",
  "drive-2":
    "Your own data drives the answers. The Q3 order export, the returns sheet and the brand guide are what the agents read. Every claim in a chat is traceable back to a file here.",
  "drive-3":
    "Read-only in the demo. Previewing and uploading are switched off for the tour. In your own workspace the Drive is fully yours — the same folder the agents write into.",

  "chat-instagram-1":
    "In this conversation the user asks for an Instagram launch post for their new vitamin C serum, and tells the agent to publish it once it's ready.",
  "chat-instagram-2":
    "The CEO agent checked your brand palette and the last thirty days of Instagram performance first, the Graphic Designer produced the creative, and the CMO published it through the Instagram connector.",
  "chat-instagram-3":
    "Two approval cards — one on creative direction, one before publishing. The agent never posts on its own.",
  "chat-instagram-4":
    "A live post on the Indian Herbs Instagram, plus the source file saved to Drive. Total cost: 7.42 credits.",

  "chat-inbox-1":
    "It starts with a simple question: what's in the inbox, and what actually needs action today? Then the user asks for a reply to a customer called Priya about the vitamin C serum, with the usage guide attached.",
  "chat-inbox-2":
    "Gmail search and thread reading found the five mails genuinely worth the user's time, and Drive supplied the real vitamin C usage guide as an attachment.",
  "chat-inbox-3":
    "The triage list ranks by money at risk, and the reply is threaded into Priya's original email instead of starting a new one.",
  "chat-inbox-4":
    "A ready-to-send reply, sitting in your Gmail drafts. The agent writes, you tap send.",

  "chat-sales-1":
    "Here the user asks the team to analyse Q3 sales and put together a short brief for their co-founder — and to be honest about where the business is leaking money.",
  "chat-sales-2":
    "The Data Analyst loaded the company's spreadsheets, plus the live Google Sheet, into a sandbox and ran Python. The Writer turned the findings into a two-page brief.",
  "chat-sales-3":
    "The answer comes in rupees, not percentages. Two point nine four lakh of returns traced back to a single bottle design — and the biggest leak is not marketing spend.",
  "chat-sales-4":
    "A Google Doc brief for the co-founder, plus a four-tab breakdown sheet with owners and dates.",

  "chat-pricing-1":
    "In this one the user is planning a new product: a thirty millilitre saffron radiance serum at 899 rupees. They ask the team to check that price against the top organic Ayurvedic brands in India.",
  "chat-pricing-2":
    "The Researcher benchmarked six live listings, the CMO modelled the launch plan and the unit economics, and the Writer produced the memo.",
  "chat-pricing-3":
    "Here the agent disagrees with the user. It recommends 1,049 rupees, and explains how 899 would undercut their own 1,499 rupee serum anchor.",
  "chat-pricing-4":
    "A pricing memo in Drive, with a three-phase launch plan, a ninety-day forecast and regulatory-safe claim wording.",

  "chat-returns-1":
    "The user noticed that returns jumped last month, and asks two things: why it happened, and what should be fixed first.",
  "chat-returns-2":
    "Gmail surfaced 214 complaint threads. The Data Analyst joined them to the return rows by SKU, and the Calendar connector found a slot that was free for the user and Ravi.",
  "chat-returns-3":
    "Watch how the agent cross-checks what customers wrote against the reason codes — and contradicts the dashboard when the two disagree.",
  "chat-returns-4":
    "The root cause is isolated to the thirty millilitre bottle, a four-item action list with owners and rupee impact, and a review meeting that is already on the calendar.",

  "chat-diwali-1":
    "Now the user wants a Diwali campaign planned for the next three weeks — content, emails and the calendar — on a budget of fifty thousand rupees.",
  "chat-diwali-2":
    "The CMO built the three-week plan and the budget split. Calendar, Sheets and Gmail each executed their part of it.",
  "chat-diwali-3":
    "One decision — the offer — unlocks the whole plan. Then the agent creates nine calendar events, a twenty-one-post sheet and the email draft.",
  "chat-diwali-4":
    "A campaign that is already scheduled: shoot days booked, the content calendar written, and the launch email waiting in your drafts.",

  "chat-outro":
    "Use the sidebar to open the next one, or create an account to point this team at your own files, inbox, calendar and Instagram.",
};

/** Public URL of the clip for a step. Missing files simply don't play. */
export function sproutClip(key: SproutVoiceKey): string {
  return `${SPROUT_VOICE_DIR}/sprout-${key}.mp3`;
}
