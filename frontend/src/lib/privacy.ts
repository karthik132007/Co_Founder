/**
 * Privacy contact configuration.
 *
 * Set NEXT_PUBLIC_PRIVACY_EMAIL in the frontend environment to publish a
 * dedicated privacy address (recommended: privacy@get-cofounder.tech).
 * Until it is set, pages fall back to the GitHub repository link and do
 * NOT display an email address that may not exist.
 */

export const PRIVACY_GITHUB_URL =
  "https://github.com/karthik132007/Co_Founder";

export const RECOMMENDED_PRIVACY_EMAIL = "privacy@get-cofounder.tech";

export function getPrivacyEmail(): string | null {
  const configured = process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim();
  return configured ? configured : null;
}
