"use client";

import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="neu-pressed py-16 px-6 mt-20 mx-4 mb-4 rounded-[3rem]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 neu-flat rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-[var(--color-accent-primary)]" />
              </div>
              <span className="text-[18px] font-bold text-bold-primary tracking-tight">Co-founder.ai</span>
            </div>
            <p className="text-[14px] text-gray-600 font-medium mt-4 max-w-[200px] leading-relaxed">
              AI-powered startup platform for founders.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-[13px] font-bold text-bold-primary mb-4 uppercase tracking-widest">Product</h4>
            <div className="flex flex-col gap-3">
              {["Features", "How It Works", "Agents", "Pricing"].map((link) => (
                <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-[14px] text-gray-600 font-medium hover:text-[var(--color-accent-primary)] transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[13px] font-bold text-bold-primary mb-4 uppercase tracking-widest">Company</h4>
            <div className="flex flex-col gap-3">
              {["About", "Blog", "Careers", "Contact"].map((link) => (
                <a key={link} href="#" className="text-[14px] text-gray-600 font-medium hover:text-[var(--color-accent-primary)] transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[13px] font-bold text-bold-primary mb-4 uppercase tracking-widest">Legal</h4>
            <div className="flex flex-col gap-3">
              {["Privacy Policy", "Terms", "Cookies"].map((link) => (
                <a key={link} href="#" className="text-[14px] text-gray-600 font-medium hover:text-[var(--color-accent-primary)] transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-[#a3b1c6] border-opacity-30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[13px] text-gray-500 font-bold">
            © 2026 Co-founder.ai
          </div>
          <div className="flex gap-6">
            {["GitHub", "Twitter", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-[13px] text-gray-500 font-bold hover:text-[var(--color-accent-primary)] transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
