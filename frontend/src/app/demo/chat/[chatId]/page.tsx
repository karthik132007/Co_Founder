"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import DemoTranscript from "@/components/demo/DemoTranscript";
import { getDemoChat } from "@/components/demo/demoChats";

export default function DemoChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const chat = getDemoChat(chatId);

  if (!chat) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <MessageSquare className="mx-auto h-6 w-6 text-[#8d9d94]" />
        <p className="mt-3 text-[14px] font-semibold text-[#0f2214]">This conversation isn&apos;t in the demo</p>
        <p className="mt-1 text-[13px] text-[#5f6f63]">
          The demo replays six recorded Indian Herbs chats.
        </p>
        <Link
          href="/demo/chat"
          className="btn-primary mt-4 inline-flex px-4 py-2 text-[13px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All recorded conversations
        </Link>
      </div>
    );
  }

  // `key` forces a clean remount when switching conversations in the sidebar.
  return <DemoTranscript key={chat.id} chat={chat} />;
}
