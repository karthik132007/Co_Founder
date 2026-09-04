"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Building2, Briefcase, Palette, Save, Loader2, Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { fetchProfile, updateProfile } from "@/lib/api";

const ACCENT = "#143620";
const TONES = ["friendly", "professional", "witty"];
const INDUSTRIES = [
  "Skin and hair care", "SaaS", "E-commerce", "Health & Wellness", "Food & Beverage",
  "Fashion", "Education", "Finance", "Real Estate", "Travel", "Other",
];

export default function ProfilePage() {
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-[#0f2214]">Profile</h2>
        <p className="text-sm text-[#5f6f63] mt-0.5">Manage your company profile and brand settings.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} /></div>
      ) : (
        <div className="card p-6 space-y-6">
          {/* Email (read-only) */}
          <Field label="Email" icon={User}>
            <input type="email" value={session.user.email} disabled
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] px-4 py-2.5 text-[14px] text-[#8d9d94] outline-none" />
          </Field>

          {/* Company Name */}
          <Field label="Company Name" icon={Building2}>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] placeholder:text-[#8d9d94] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200" />
          </Field>

          {/* Description */}
          <Field label="Description" icon={Building2}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] placeholder:text-[#8d9d94] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200 resize-none" />
          </Field>

          {/* Industry */}
          <Field label="Industry" icon={Briefcase}>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-[#e8e9e3] bg-[#fdfcf8] hover:border-[#c2c9c0] focus:bg-white px-4 py-2.5 text-[14px] text-[#0f2214] outline-none focus:border-[#143620] focus:ring-4 focus:ring-[#143620]/10 transition-all duration-200">
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>

          {/* Tone */}
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

          {/* Actions */}
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
    </motion.div>
  );
}
