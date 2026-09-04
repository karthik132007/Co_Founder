"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Building2, Briefcase, Palette, Save, Loader2, Check,
  Settings as SettingsIcon, Shield, Bell
} from "lucide-react";
import { getSession } from "@/lib/session";
import { fetchProfile, updateProfile, type ProfileData } from "@/lib/api";

const ACCENT = "#143620";
const TONES = ["friendly", "professional", "witty"];
const INDUSTRIES = [
  "Skin and hair care", "SaaS", "E-commerce", "Health & Wellness", "Food & Beverage",
  "Fashion", "Education", "Finance", "Real Estate", "Travel", "Other",
];

function GeneralTab() {
  const session = getSession();
  const userId = session?.user?.id;

  if (!session) return null;

  const Section = ({ icon: Icon, title, desc, children }: {
    icon: typeof SettingsIcon; title: string; desc: string; children: React.ReactNode;
  }) => (
    <div className="border border-[#e8e9e3] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-[#e8e9e3] pb-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#eaf0e8] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[#0f2214]">{title}</h3>
          <p className="text-[12px] text-[#5f6f63]">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-[#e8e9e3] pb-4">
        <h2 className="text-lg font-semibold text-[#0f2214]">General Settings</h2>
      </div>

      <Section icon={Shield} title="Account" desc="Your email and password.">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#5f6f63] uppercase tracking-wider">Email</label>
            <input type="email" value={session.user.email} disabled
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] px-4 py-2.5 text-[14px] text-[#8d9d94] outline-none mt-1" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#5f6f63] uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="password" value="••••••••" disabled
                className="flex-1 rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] px-4 py-2.5 text-[14px] text-[#8d9d94] outline-none" />
              <button disabled className="btn-primary px-4 py-2.5 text-[13px] opacity-40 cursor-not-allowed">Change</button>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" desc="Manage notifications.">
        <p className="text-[13px] text-[#8d9d94]">Email and in-app notification preferences will be available here.</p>
      </Section>

      <Section icon={Palette} title="Appearance" desc="Theme preferences.">
        <p className="text-[13px] text-[#8d9d94]">Theme and display settings will be available here.</p>
      </Section>
    </div>
  );
}

function CompanyTab() {
  const session = getSession();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("professional");

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId)
      .then((p) => {
        setName(p.company.company_name);
        setDescription(p.company.small_description);
        setIndustry(p.company.industry);
        setTone(p.company.tone || "professional");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile(userId, {
        company_name: name,
        small_description: description,
        industry,
        tone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [userId, name, description, industry, tone]);

  if (!session || !userId) return null;

  const Field = ({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[13px] font-semibold text-[#2f3e32]">
        <Icon className="w-3.5 h-3.5 text-[#8d9d94]" />{label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="border-b border-[#e8e9e3] pb-4">
        <h2 className="text-lg font-semibold text-[#0f2214]">Company Settings</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} /></div>
      ) : (
        <div className="space-y-6">
          <Field label="Email" icon={User}>
            <input type="email" value={session.user.email} disabled
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] px-4 py-2.5 text-[14px] text-[#8d9d94] outline-none" />
          </Field>

          <Field label="Company Name" icon={Building2}>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] placeholder:text-[#8d9d94] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200" />
          </Field>

          <Field label="Description" icon={Building2}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] placeholder:text-[#8d9d94] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200 resize-none" />
          </Field>

          <Field label="Industry" icon={Briefcase}>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200">
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>

          <Field label="Brand Tone" icon={Palette}>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button key={t} type="button" onClick={() => setTone(t)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-medium capitalize transition-all duration-200 ${
                    tone === t ? "border-[#143620] bg-[#eaf0e8] text-[#143620] shadow-sm ring-1 ring-[#143620]/20" : "border-[#e8e9e3] text-[#5f6f63] bg-white hover:border-[#c2c9c0] hover:-translate-y-0.5 hover:shadow-sm"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="btn-primary px-5 py-2.5 text-[13px] disabled:opacity-60 inline-flex items-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && (
              <motion.span initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} className="flex items-center gap-1.5 text-[13px] font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <Check className="w-3.5 h-3.5" /> Saved successfully
              </motion.span>
            )}
            {error && <span className="text-[13px] font-medium text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"general" | "company">("general");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white w-full max-w-4xl h-[650px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden border border-[#e8e9e3]"
          >
            {/* Left Sidebar */}
            <div className="w-full sm:w-[240px] bg-[#fdfcf8] border-r border-[#e8e9e3] p-4 flex flex-col gap-1 shrink-0">
              <div className="mb-2 px-2">
                <h3 className="text-xs font-semibold text-[#8d9d94] uppercase tracking-wider">Settings</h3>
              </div>
              <button
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  activeTab === 'general' ? 'bg-white shadow-sm border border-[#e8e9e3] text-[#0f2214]' : 'text-[#5f6f63] hover:bg-[#f6f5ef] border border-transparent'
                }`}
              >
                <SettingsIcon className="w-4 h-4" /> General
              </button>
              <button
                onClick={() => setActiveTab("company")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  activeTab === 'company' ? 'bg-white shadow-sm border border-[#e8e9e3] text-[#0f2214]' : 'text-[#5f6f63] hover:bg-[#f6f5ef] border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4" /> Company
              </button>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-lg hover:bg-[#f6f5ef] text-[#8d9d94] hover:text-[#2f3e32] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="max-w-2xl">
                {activeTab === "general" && <GeneralTab />}
                {activeTab === "company" && <CompanyTab />}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
