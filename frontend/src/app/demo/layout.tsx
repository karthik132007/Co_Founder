import type { Metadata } from "next";
import DemoShell from "@/components/demo/DemoShell";

export const metadata: Metadata = {
  title: "Demo workspace — Co-Founder AI",
  description:
    "Explore a real Indian Herbs workspace: six recorded conversations between the founder and the AI team — research, design, publishing, email, sales analysis and campaign planning.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
