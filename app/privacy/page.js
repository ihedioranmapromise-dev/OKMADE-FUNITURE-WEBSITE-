import Navbar from "@/app/components/Navbar";

export const metadata = {
  title: "Privacy Policy — OKMADE",
  description: "How OKMADE Furniture & Interiors collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  const updated = "6 October 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 pt-16">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-amber-800 dark:text-amber-400 mb-2 font-['Dancing_Script',_cursive]">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: {updated}
        </p>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy explains how OKMADE Furniture &amp; Interiors (&quot;OKMADE&quot;,
              &quot;we&quot;, &quot;us&quot;) collects, uses, and protects your personal information when
              you use okmade.com. This policy complies with the Nigeria Data Protection
              Regulation (NDPR) and, where applicable, the EU GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-2">We collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Account information:</strong> name, username, email, phone number,
                address, profile picture
              </li>
              <li>
                <strong>Content you post:</strong> photos, descriptions, comments, project
                details
              </li>
              <li>
                <strong>Usage data:</strong> pages visited, referrer, approximate location from
                IP, browser/device type
              </li>
              <li>
                <strong>Cookies:</strong> session cookies for login, theme preferences, recent
                searches
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To operate and improve the Site</li>
              <li>To communicate with you about your account or projects</li>
              <li>To send notifications you have opted into</li>
              <li>To analyze traffic and usage patterns (in aggregate)</li>
              <li>To prevent fraud, spam, and abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              4. What We Do NOT Do
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do not sell your personal information</li>
              <li>We do not share your email or phone number publicly</li>
              <li>We do not use your content to train third-party AI models</li>
              <li>We do not send spam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              5. Where Data Is Stored
            </h2>
            <p>
              Your data is stored securely in Supabase (Postgres database and file storage) and
              served through Vercel&apos;s global content delivery network. Supabase and Vercel
              maintain industry-standard encryption in transit (TLS) and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              6. Cookies
            </h2>
            <p>
              We use essential cookies to keep you logged in, remember your theme (light/dark),
              and store your recent searches. We also use Google Analytics (G-C7DX7WTH30) to
              understand how visitors use the Site. You can disable cookies in your browser,
              but some features may stop working.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access your personal data (self-service export in Settings)</li>
              <li>Correct inaccurate data (edit your profile)</li>
              <li>Delete your account (Settings → Danger Zone)</li>
              <li>Withdraw consent for marketing emails (Settings → Notifications)</li>
              <li>Lodge a complaint with the Nigeria Data Protection Commission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              8. Account Deletion
            </h2>
            <p>
              When you delete your account, we immediately sign you out and hide your profile
              and posts. After 7 days, we permanently delete your account data, posts, and
              uploaded images. Messages you sent to other users are preserved but shown as
              &quot;Deleted User&quot; so other users&apos; chat history stays intact.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Site is not intended for children under 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided
              us with personal information, contact us at okeywoodwork@gmail.com and we will
              delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              announced on the Site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              11. Contact
            </h2>
            <p>
              For privacy questions or data requests, contact{" "}
              <a href="mailto:okeywoodwork@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">
                okeywoodwork@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <p>
            OKMADE Furniture &amp; Interiors · Aba, Abia State, Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}
