import Navbar from "@/app/components/Navbar";

export const metadata = {
  title: "Terms of Service — OKMADE",
  description: "Terms and conditions for using OKMADE Furniture & Interiors services.",
};

export default function TermsPage() {
  const updated = "6 October 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 pt-16">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-amber-800 dark:text-amber-400 mb-2 font-['Dancing_Script',_cursive]">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: {updated}
        </p>

        <div className="prose prose-amber dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              1. Introduction
            </h2>
            <p>
              Welcome to OKMADE Furniture &amp; Interiors (&quot;OKMADE&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use
              of the OKMADE website located at okmade.com (the &quot;Site&quot;) and any related
              services. By accessing or using the Site, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              2. Eligibility
            </h2>
            <p>
              You must be at least 13 years of age to use the Site. If you are under 18, you
              represent that you have permission from a parent or legal guardian. By using the
              Site, you represent and warrant that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              3. Account Registration
            </h2>
            <p>
              Some features of the Site require an account. You agree to provide accurate,
              current, and complete information during registration and to keep it up to date.
              You are responsible for maintaining the confidentiality of your password and for
              all activity that occurs under your account. Notify us immediately at
              okeywoodwork@gmail.com if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              4. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Post content that is illegal, defamatory, harassing, hateful, or sexually explicit</li>
              <li>Impersonate another person, business, or OKMADE staff</li>
              <li>Upload viruses, malware, or attempt to compromise the Site</li>
              <li>Scrape, harvest, or bulk-collect data from the Site without permission</li>
              <li>Spam other users or send unsolicited commercial messages</li>
              <li>Interfere with other users&apos; enjoyment of the Site</li>
              <li>Violate any applicable law of the Federal Republic of Nigeria</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these rules
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              5. User Content
            </h2>
            <p>
              You retain ownership of any content you upload, including photos, text, and
              project information (&quot;User Content&quot;). By uploading User Content, you grant
              OKMADE a worldwide, royalty-free, non-exclusive license to display, distribute,
              and promote your User Content within the Site and our marketing channels.
            </p>
            <p className="mt-2">
              You represent that you own or have the necessary rights to any User Content you
              upload. You may delete your User Content at any time; the license terminates when
              the content is removed, except for cached copies and any content already shared by
              others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              6. Orders and Payments
            </h2>
            <p>
              Any furniture, interior work, or custom project arranged through OKMADE is subject
              to a separate written agreement. Prices, timelines, and specifications are
              confirmed in writing before work begins. Deposits are non-refundable once
              materials are purchased.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              7. Intellectual Property
            </h2>
            <p>
              All Site design, code, logos, brand names, and non-user content are the property
              of OKMADE and are protected by copyright and trademark law. You may not copy,
              reproduce, or create derivative works without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              8. Disclaimer
            </h2>
            <p>
              The Site is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
              kind, express or implied. OKMADE does not guarantee that the Site will be
              uninterrupted, error-free, or free of viruses. You use the Site at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by Nigerian law, OKMADE shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising out
              of your use of the Site, even if we have been advised of the possibility of such
              damages. Our total liability shall not exceed NGN 50,000 or the amount you paid us
              in the past 12 months, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              10. Termination
            </h2>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms
              or for any other reason at our sole discretion. You may delete your account at any
              time through Settings. On termination, sections 5, 7, 9, and 12 survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              11. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes will be announced
              on the Site. Continued use of the Site after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              12. Governing Law and Disputes
            </h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any
              dispute arising from these Terms shall be subject to the exclusive jurisdiction
              of the courts of Abia State, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              13. Contact
            </h2>
            <p>
              Questions about these Terms? Contact us at{" "}
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
