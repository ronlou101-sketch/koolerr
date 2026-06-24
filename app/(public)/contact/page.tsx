import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us — Koolerr',
  description:
    'Get in touch with the Koolerr team. We respond to all inquiries within one business day.',
}

const CONTACT_FAQS = [
  {
    q: 'How quickly do you respond?',
    a: 'We respond to all support and sales inquiries within one business day. Priority support customers (GROW and SCALE plans) receive faster response times.',
  },
  {
    q: 'I need help setting up my Business Brain.',
    a: 'Check our Help Center for step-by-step guides on Business Brain setup. If you need additional help, email us with your account email and a description of what you are trying to configure.',
  },
  {
    q: 'I want to discuss enterprise or custom pricing.',
    a: "Email us at team@koolerr.com with your company name, team size, and a brief description of your use case. We'll schedule a call within one business day.",
  },
  {
    q: 'I think I found a bug.',
    a: 'We take bug reports seriously. Please email team@koolerr.com with your account email, a description of the issue, steps to reproduce it, and (if possible) a screenshot. We will acknowledge within 24 hours.',
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Contact
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              We&rsquo;d love to hear from you
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Whether you have a question about the platform, need help getting set up, or want to
              discuss a custom plan — our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact options */}
      <section className="bg-background pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Primary contact */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-8">
                <h2 className="text-lg font-bold text-foreground">Send us an email</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  For general inquiries, platform support, billing questions, and enterprise sales.
                </p>
                <a
                  href="mailto:team@koolerr.com"
                  className="mt-6 flex items-center gap-2 text-base font-extrabold text-foreground transition-opacity hover:opacity-70"
                >
                  team@koolerr.com →
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  We respond to all inquiries within one business day.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-8">
                <h2 className="text-lg font-bold text-foreground">Business hours</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Our team is available Monday through Friday.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM ET' },
                    { day: 'Saturday – Sunday', hours: 'No response (check back Monday)' },
                    { day: 'Public holidays', hours: 'No response' },
                  ].map((row) => (
                    <div key={row.day} className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-foreground">{row.day}</span>
                      <span className="text-sm text-muted-foreground">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-8">
                <h2 className="text-lg font-bold text-foreground">Help Center</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Many questions are answered in our self-service Help Center — available 24/7.
                </p>
                <Link
                  href="/support"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-70"
                >
                  Visit Help Center →
                </Link>
              </div>
            </div>

            {/* Contact FAQ */}
            <div>
              <h2 className="mb-6 text-lg font-bold text-foreground">Common questions</h2>
              <div className="space-y-2">
                {CONTACT_FAQS.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-xl border border-border bg-background"
                  >
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

              <div className="mt-8 rounded-xl bg-foreground p-8 text-background">
                <h2 className="text-lg font-bold">Security disclosures</h2>
                <p className="mt-2 text-sm leading-relaxed opacity-70">
                  If you have discovered a security vulnerability in the Koolerr platform, please
                  disclose it responsibly by emailing us directly at{' '}
                  <a
                    href="mailto:team@koolerr.com"
                    className="underline underline-offset-2 opacity-90 hover:opacity-60"
                  >
                    team@koolerr.com
                  </a>{' '}
                  with subject line &ldquo;Security Disclosure.&rdquo; Please do not post
                  vulnerability details publicly before we have had a chance to address them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
