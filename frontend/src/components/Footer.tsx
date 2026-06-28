"use client";

import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-16 px-6 bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-peach-400 flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-[15px] font-bold text-foreground">AI Co-Founder</span>
            </div>
            <p className="text-[14px] text-gray-500 mt-4 max-w-[200px] leading-relaxed">
              AI-powered startup platform for founders.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-4 uppercase tracking-wider">Product</h4>
            <div className="flex flex-col gap-2">
              {["Features", "How It Works", "Agents", "Pricing"].map((link) => (
                <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-[14px] text-gray-500 hover:text-pink-500 transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-4 uppercase tracking-wider">Company</h4>
            <div className="flex flex-col gap-2">
              {["About", "Blog", "Careers", "Contact"].map((link) => (
                <a key={link} href="#" className="text-[14px] text-gray-500 hover:text-pink-500 transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-4 uppercase tracking-wider">Legal</h4>
            <div className="flex flex-col gap-2">
              {["Privacy Policy", "Terms", "Cookies"].map((link) => (
                <a key={link} href="#" className="text-[14px] text-gray-500 hover:text-pink-500 transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[13px] text-gray-400 font-medium">
            © 2025 AI Co-Founder
          </div>
          <div className="flex gap-6">
            {["GitHub", "Twitter", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-[13px] text-gray-400 font-medium hover:text-pink-500 transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
