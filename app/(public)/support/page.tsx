import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help Center — Koolerr',
  description:
    'Get help with the Koolerr AI Workforce Platform. Find answers, guides, and contact support.',
}

const HELP_CATEGORIES = [
  {
    title: 'Getting started',
    description: 'Everything you need to go from signup to your first AI deliverable.',
    icon: '🚀',
    articles: [
      'How to create your account and first Workforce',
      'Setting up your Business Brain for the first time',
      'Running your first Engagement Run',
      'Understanding the Approvals workflow',
    ],
  },
  {
    title: 'Business Brain',
    description: 'How to build, update, and get the most out of your brand knowledge base.',
    icon: '🧠',
    articles: [
      'What to include in your Business Brain',
      'Adding brand voice and tone guidelines',
      'Documenting your products and audience',
      'Updating your Business Brain after a relaunch',
    ],
  },
  {
    title: 'Workforces & Runs',
    description: 'Configure your AI Workforces and understand how Engagement Runs work.',
    icon: '👥',
    articles: [
      'How to configure a Workforce goal',
      'Understanding AI Employee roles',
      'Monitoring an active Engagement Run',
      'What happens when a run fails',
    ],
  },
  {
    title: 'Approvals & Deliverables',
    description: 'Managing the output your AI team produces.',
    icon: '✅',
    articles: [
      'How to review and approve a deliverable',
      'Requesting revisions on a deliverable',
      'Where approved deliverables are stored',
      'Understanding the Audit Trail',
    ],
  },
  {
    title: 'Billing & plans',
    description: 'Subscriptions, upgrades, invoices, and payment questions.',
    icon: '💳',
    articles: [
      'How subscription billing works',
      'Upgrading or downgrading your plan',
      'Understanding your Engagement Run limit',
      'Cancelling your subscription',
    ],
  },
  {
    title: 'Account & security',
    description: 'Account settings, password reset, and security best practices.',
    icon: '🔒',
    articles: [
      'How to reset your password',
      'Managing your account email',
      'Understanding your data and privacy',
      'Deleting your account',
    ],
  },
]

const FAQS = [
  {
    q: 'My Engagement Run is stuck. What should I do?',
    a: 'If a run appears stuck for more than 10 minutes, refresh Mission Control. If it still shows active, navigate to Runs and check the run status. If the run shows an error, it has been automatically logged. Contact support at team@koolerr.com with your run ID and we will investigate.',
  },
  {
    q: 'A deliverable was approved but I cannot find it. Where did it go?',
    a: 'Approved deliverables are stored under Runs → [Run name] → Deliverables. They are also visible from the Mission Control dashboard under the relevant Engagement Run.',
  },
  {
    q: 'The AI output does not sound like my brand. How do I fix this?',
    a: 'This usually means your Business Brain needs more context. Add specific brand voice examples, tone guidelines, and avoid/use word lists. The more specific your Brain is, the more on-brand the output. See the Business Brain setup guide for best practices.',
  },
  {
    q: 'Can I add team members to my account?',
    a: 'Team accounts are on our roadmap. Currently, each Koolerr account is single-user. If you need multi-seat access, contact us at team@koolerr.com to discuss your requirements.',
  },
  {
    q: 'I was charged the wrong amount. How do I get a refund?',
    a: 'Contact us at team@koolerr.com within 30 days of the charge with your account email and a description of the issue. We will review and respond within one business day.',
  },
  {
    q: 'How do I delete my account and all my data?',
    a: 'Email team@koolerr.com from your account email with the subject line "Account deletion request." We will process the request within 30 days and confirm when complete. See our Privacy Policy for what data is retained after deletion.',
  },
]

export default function SupportPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-foreground py-16 text-background sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-50">
              Help Center
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
            <p className="mt-4 text-base leading-relaxed opacity-70">
              Find answers to common questions, learn how the platform works, or contact our team.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="w-full rounded-lg bg-background px-8 py-3 text-center text-sm font-extrabold text-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Contact support →
              </Link>
              <a
                href="mailto:team@koolerr.com"
                className="w-full rounded-lg border border-background/30 px-8 py-3 text-center text-sm font-semibold text-background hover:border-background/60 sm:w-auto"
              >
                team@koolerr.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Help categories */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-2xl font-extrabold tracking-tight text-foreground">
            Browse by topic
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HELP_CATEGORIES.map((cat) => (
              <div key={cat.title} className="rounded-xl border border-border bg-card p-6">
                <p className="mb-3 text-2xl">{cat.icon}</p>
                <h3 className="mb-1 text-base font-bold text-foreground">{cat.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {cat.description}
                </p>
                <ul className="space-y-2">
                  {cat.articles.map((article) => (
                    <li key={article}>
                      <span className="text-sm text-muted-foreground">{article}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Detailed documentation is coming soon. In the meantime,{' '}
            <Link
              href="/contact"
              className="text-foreground underline underline-offset-2 hover:opacity-70"
            >
              contact support
            </Link>{' '}
            for any question not answered below.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-foreground">
                  {faq.q}
                  <span className="flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <div className="border-t border-border px-6 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Still need help?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Our team responds to all inquiries within one business day.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="w-full rounded-lg bg-foreground px-8 py-3.5 text-center text-sm font-extrabold text-background transition-opacity hover:opacity-90 sm:w-auto"
            >
              Contact support →
            </Link>
            <a
              href="mailto:team@koolerr.com"
              className="w-full rounded-lg border border-border px-8 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-muted sm:w-auto"
            >
              team@koolerr.com
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
