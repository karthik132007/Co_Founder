"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import Chat from "@/components/Chat";

export default function ChatPage() {
  const session = getSession();
  const router = useRouter();

  const handleSessionCreated = useCallback((sessionId: string, _title: string) => {
    router.replace(`/${sessionId}`);
  }, [router]);

  if (!session) return null;

  return (
    <Chat
        user={session.user}
        initialSessionId={null}
        initialTitle={null}
        onSessionCreated={handleSessionCreated}
      />
  );
}
