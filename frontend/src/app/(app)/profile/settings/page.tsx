"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Palette } from "lucide-react";
import { getSession } from "@/lib/session";
import { fetchProfile, updateProfile, type ProfileData } from "@/lib/api";
import { useEffect } from "react";

const ACCENT = "#4f46e5";

export default function SettingsPage() {
  const session = getSession();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId).then(setProfile).catch(() => {});
  }, [userId]);

  if (!session) return null;

  const Section = ({ icon: Icon, title, desc, children }: {
    icon: typeof Settings; title: string; desc: string; children: React.ReactNode;
  }) => (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0"><Icon className="w-4 h-4" style={{ color: ACCENT }} /></div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#0a0a0a]">{title}</h3>
          <p className="text-[12px] text-[#6b7280]">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-[#0a0a0a]">Settings</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <Section icon={Shield} title="Account" desc="Your email and password.">
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wider">Email</label>
            <input type="email" value={session.user.email} disabled
              className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-[14px] text-[#9ca3af] outline-none mt-1" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="password" value="••••••••" disabled
                className="flex-1 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-[14px] text-[#9ca3af] outline-none" />
              <button disabled className="btn-primary px-4 py-2.5 text-[13px] opacity-40 cursor-not-allowed">Change</button>
            </div>
            <p className="text-[11px] text-[#9ca3af] mt-1.5">Password change coming soon.</p>
          </div>
        </div>
      </Section>

      {/* Company summary */}
      {profile && (
        <Section icon={Settings} title="Company" desc="Your brand profile (editable from the Profile page).">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div><span className="text-[#9ca3af]">Name</span><p className="font-medium text-[#0a0a0a]">{profile.company.company_name}</p></div>
            <div><span className="text-[#9ca3af]">Industry</span><p className="font-medium text-[#0a0a0a]">{profile.company.industry}</p></div>
            <div className="col-span-2"><span className="text-[#9ca3af]">Tone</span><p className="font-medium text-[#0a0a0a] capitalize">{profile.company.tone}</p></div>
          </div>
        </Section>
      )}

      {/* Notifications placeholder */}
      <Section icon={Bell} title="Notifications" desc="Coming soon.">
        <p className="text-[13px] text-[#9ca3af]">Email and in-app notification preferences will be available here.</p>
      </Section>

      {/* Appearance placeholder */}
      <Section icon={Palette} title="Appearance" desc="Coming soon.">
        <p className="text-[13px] text-[#9ca3af]">Theme and display settings will be available here.</p>
      </Section>
    </motion.div>
  );
}
