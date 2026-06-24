import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Koolerr',
  description:
    'How Koolerr collects, uses, and protects your personal information. Your data is yours.',
}

const EFFECTIVE_DATE = 'June 24, 2026'

export default function PrivacyPage() {
  return (
    <div className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Legal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Last updated: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Who we are</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr (&ldquo;Koolerr,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) is an AI Workforce Platform that enables businesses to build,
              deploy, and manage AI marketing teams. Our platform is accessible at koolerr.com. For
              privacy questions, contact us at{' '}
              <a
                href="mailto:team@koolerr.com"
                className="text-foreground underline underline-offset-2 hover:opacity-70"
              >
                team@koolerr.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Information we collect</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We collect information you provide directly to us and information generated
              automatically through your use of the platform.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">
              Information you provide directly
            </h3>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">Account information:</strong> Your name, email
                address, and password when you create an account.
              </li>
              <li>
                <strong className="text-foreground">Business Brain content:</strong> Brand voice
                guidelines, product information, audience descriptions, and any other content you
                add to your Business Brain.
              </li>
              <li>
                <strong className="text-foreground">Workforce configurations:</strong> Goals,
                instructions, and settings you configure for your AI Workforces.
              </li>
              <li>
                <strong className="text-foreground">Payment information:</strong> Billing details
                are collected and stored by Stripe, our payment processor. Koolerr never stores your
                full card number or CVV.
              </li>
              <li>
                <strong className="text-foreground">Communications:</strong> Messages you send to
                our support team.
              </li>
            </ul>
            <h3 className="mt-4 text-base font-bold text-foreground">
              Information collected automatically
            </h3>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">Usage data:</strong> Engagement Run counts,
                Deliverable production volume, approval activity, and feature usage patterns.
              </li>
              <li>
                <strong className="text-foreground">Log data:</strong> IP address, browser type,
                page visits, and timestamps, collected for security and operational purposes.
              </li>
              <li>
                <strong className="text-foreground">Session data:</strong> Authentication tokens
                managed by Supabase Auth. We use server-side session validation; we do not rely on
                unvalidated client-side cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. How we use your information</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>Create and maintain your account and provide you access to the platform.</li>
              <li>
                Execute Engagement Runs by providing your Business Brain content and Workforce
                configuration to the AI processing layer.
              </li>
              <li>Process payments and manage your subscription via Stripe.</li>
              <li>
                Send transactional emails (account confirmation, password reset, billing receipts).
              </li>
              <li>Respond to your support requests and communications.</li>
              <li>Monitor platform health, security, and prevent fraud or abuse.</li>
              <li>Produce usage analytics displayed in your platform dashboard.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We do <strong className="text-foreground">not</strong> use your Business Brain content
              or AI-generated deliverables to train shared AI models, and we do not sell your
              personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Third-party services</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr uses the following third-party services to operate the platform. Each service
              processes your data only to the extent necessary to deliver its function.
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  name: 'Supabase',
                  role: 'Authentication and database storage',
                  detail:
                    'Your account credentials and platform data are stored in Supabase-managed infrastructure. Supabase operates under SOC 2 Type 2 compliance.',
                },
                {
                  name: 'Stripe',
                  role: 'Payment processing and subscription management',
                  detail:
                    'All payment information is handled directly by Stripe. Koolerr receives only a payment confirmation and a Stripe Customer ID — never raw card data.',
                },
                {
                  name: 'Anthropic',
                  role: 'AI inference (powering AI Employees and Workforces)',
                  detail:
                    "Your Business Brain content and Workforce instructions are transmitted to Anthropic's Claude API to execute Engagement Runs. Content transmitted for inference is governed by Anthropic's API usage policy. It is not retained for model training.",
                },
                {
                  name: 'Vercel',
                  role: 'Platform hosting and delivery',
                  detail:
                    'Koolerr is hosted on Vercel. Vercel may process request metadata (IP addresses, headers) in the course of serving the application.',
                },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="rounded-lg border border-border bg-muted/40 p-4"
                >
                  <p className="text-sm font-bold text-foreground">
                    {provider.name} —{' '}
                    <span className="font-normal text-muted-foreground">{provider.role}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {provider.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Data retention</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We retain your account data and platform content for as long as your account is
              active. If you cancel your subscription and request deletion of your account, we will
              delete your personal data within 30 days, except where we are required to retain it by
              law (e.g., billing records for tax compliance).
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Audit Trail records may be retained for up to 12 months after account deletion for
              fraud prevention and security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Data security</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We take the security of your data seriously. Our platform implements:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>Encrypted data transmission (TLS) on all connections.</li>
              <li>
                Row-level security (RLS) in our database — your data is isolated to your tenant and
                cannot be accessed by other customers.
              </li>
              <li>
                Server-side session validation — we use{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">getUser()</code> rather than
                cookie-based trust to validate every authenticated request.
              </li>
              <li>No secrets or credentials stored in source code or version control.</li>
              <li>An immutable Audit Trail of every AI action on the platform.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No system is perfectly secure. If you believe your account has been compromised,
              contact us immediately at team@koolerr.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr uses cookies and similar storage mechanisms solely for authentication (to
              maintain your logged-in session). We do not use advertising cookies, cross-site
              tracking cookies, or analytics cookies from third parties. If you disable cookies, you
              will not be able to remain logged in to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Your rights</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Depending on your location, you may have the following rights regarding your personal
              data:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">Access:</strong> Request a copy of the personal
                data we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Correction:</strong> Request correction of
                inaccurate data.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> Request deletion of your
                personal data (subject to legal retention requirements).
              </li>
              <li>
                <strong className="text-foreground">Portability:</strong> Request your data in a
                structured, commonly used format.
              </li>
              <li>
                <strong className="text-foreground">Objection:</strong> Object to processing of your
                data in certain circumstances.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To exercise any of these rights, email us at{' '}
              <a
                href="mailto:team@koolerr.com"
                className="text-foreground underline underline-offset-2 hover:opacity-70"
              >
                team@koolerr.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Children</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr is not directed at or intended for use by children under the age of 16. We do
              not knowingly collect personal information from children. If you believe a child under
              16 has provided us personal information, contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">10. Changes to this policy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We may update this Privacy Policy from time to time. When we make material changes, we
              will notify you by email and update the effective date at the top of this page. Your
              continued use of Koolerr after the updated policy takes effect constitutes your
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">11. Contact us</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Koolerr</strong>
              </p>
              <p>
                Email:{' '}
                <a
                  href="mailto:team@koolerr.com"
                  className="text-foreground underline underline-offset-2 hover:opacity-70"
                >
                  team@koolerr.com
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 flex items-center gap-4 border-t border-border pt-8">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Terms of Service
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
