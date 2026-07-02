"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

const subscribeToSession = () => () => {};
const getServerSessionSnapshot = () => null;

export default function DashboardPage() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeToSession,
    getSession,
    getServerSessionSnapshot,
  );

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
    }
  }, [router, session]);

  if (!session) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-900 font-sans">
        <Loader2 className="h-6 w-6 animate-spin text-[#635BFF]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center text-gray-900 font-sans p-8">
      <div className="text-center">
        <p className="text-sm font-bold text-[#635BFF] mb-3">Dashboard</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Meme placeholder unlocked.
        </h1>
        <p className="text-gray-500 font-medium">
          Me after onboarding: the dashboard has entered the chat.
        </p>
      </div>
    </main>
  );
}
