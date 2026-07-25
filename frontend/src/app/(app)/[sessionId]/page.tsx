"use client";

import { useParams } from "next/navigation";
import { getSession } from "@/lib/session";
import Chat from "@/components/Chat";

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = getSession();

  if (!session) return null;

  return (
    <Chat
        user={session.user}
        initialSessionId={sessionId}
        initialTitle={null}
        onSessionCreated={() => {}}
      />
  );
}
