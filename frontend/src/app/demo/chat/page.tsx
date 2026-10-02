"use client";

import { useState } from "react";
import { Search, Camera, Mail, BarChart3, TrendingUp, CalendarDays, ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { DEMO_CHATS, chatDateLabel, type DemoChat } from "@/components/demo/demoChats";

const CHAT_ICONS: Record<DemoChat["iconKey"], typeof Search> = {
  instagram: Camera, inbox: Mail, sales: BarChart3,
  research: Search, returns: TrendingUp, campaign: CalendarDays,
};

export default function DemoChatIndexPage() {
  const [query, setQuery] = useState("");
  const chats = DEMO_CHATS.filter((chat) =>
    `${chat.title} ${chat.subtitle} ${chat.plugins.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <div className="mb-8 pt-3 sm:pt-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#718076]">Indian Herbs workspace</p>
        <h1 className="hero-serif mt-3 text-4xl tracking-tight text-[#0f2214] sm:text-5xl">A little less busy.<br />A lot more done.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-[#5f6f63]">Explore six conversations, from the first idea to the finished work.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e5e9e2] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#edf0ea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-sm font-semibold text-[#0f2214]">All conversations <span className="ml-2 font-normal text-[#718076]">{DEMO_CHATS.length}</span></h2>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718076]" />
            <input aria-label="Search conversations" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations…" className="w-full rounded-lg border border-[#e5e9e2] bg-[#fafbf8] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#143620] focus:ring-2 focus:ring-[#143620]/10" />
          </div>
        </div>
        <div className="divide-y divide-[#edf0ea]">
          {chats.map((chat) => {
            const Icon = CHAT_ICONS[chat.iconKey];
            return (
              <Link key={chat.id} href={`/demo/chat/${chat.id}`} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-[#f7f9f4] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#143620] sm:px-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eff3eb] text-[#143620]"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-5 text-[#203926]">{chat.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#718076]">{chat.subtitle}</p>
                </div>
                <span className="hidden shrink-0 text-xs text-[#718076] sm:block">{chatDateLabel(chat)}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#95a18f] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#143620]" />
              </Link>
            );
          })}
          {chats.length === 0 && <div className="px-6 py-12 text-center"><p className="text-sm text-[#5f6f63]">No conversations match your search.</p><button onClick={() => setQuery("")} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#143620]"><X className="h-3.5 w-3.5" /> Clear search</button></div>}
        </div>
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-[#718076]">A preview of what your team can do. <Link href="/auth" className="font-medium text-[#143620] underline underline-offset-4">Start your own workspace</Link></p>
    </div>
  );
}
