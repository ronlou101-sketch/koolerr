import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Koolerr',
  description:
    'The terms governing your use of the Koolerr AI Workforce Platform. Simple, fair, and transparent.',
}

const EFFECTIVE_DATE = 'June 24, 2026'

export default function TermsPage() {
  return (
    <div className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Legal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} · Last updated: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Acceptance of terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              By creating an account on Koolerr or using the Koolerr AI Workforce Platform
              (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service
              (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the
              Service. These Terms constitute a legally binding agreement between you
              (&ldquo;Customer,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and Koolerr
              (&ldquo;Koolerr,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              If you are using the Service on behalf of an organization, you represent that you have
              authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Description of service</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr is an AI Workforce Platform that enables customers to create and deploy AI
              Marketing Teams — including AI Employees, Workforces, and Engagement Runs — powered by
              the customer&apos;s Business Brain. The Service includes:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>AI Workforce creation and management</li>
              <li>Business Brain — a brand knowledge base</li>
              <li>Engagement Run execution and monitoring</li>
              <li>Deliverable production, approval, and storage</li>
              <li>Mission Control dashboard and analytics</li>
              <li>CTO Agent (Atlas) for platform and engineering intelligence</li>
              <li>Audit Trail and Consent management</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We reserve the right to modify, update, or discontinue features of the Service at any
              time, with reasonable notice where practicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Account terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To use the Service, you must:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>Be at least 18 years old or the age of legal majority in your jurisdiction.</li>
              <li>
                Provide accurate, complete, and current information when creating your account.
              </li>
              <li>Maintain the security of your account credentials.</li>
              <li>
                Notify us immediately at team@koolerr.com if you suspect unauthorized access to your
                account.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You are responsible for all activity that occurs under your account, whether or not
              authorized by you. Koolerr is not liable for any loss or damage arising from
              unauthorized account access resulting from your failure to maintain credential
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Acceptable use</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You agree to use the Service only for lawful purposes and in accordance with these
              Terms. You may not use the Service to:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>Produce content that is illegal, defamatory, fraudulent, or deceptive.</li>
              <li>Generate spam or unsolicited commercial communications at scale.</li>
              <li>
                Infringe the intellectual property rights, privacy rights, or other rights of any
                third party.
              </li>
              <li>Violate any applicable law or regulation.</li>
              <li>
                Attempt to gain unauthorized access to any system, network, or data — including
                other customer environments on the Koolerr platform.
              </li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
              <li>
                Use the Service to train AI models outside of Koolerr without our prior written
                consent.
              </li>
              <li>
                Circumvent, disable, or interfere with security features of the Service, including
                the Trust Engine or Consent & Rights Ledger.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We may suspend or terminate your account at any time if we determine, in our sole
              discretion, that you have violated these acceptable use terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Payment terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr offers subscription-based plans billed monthly. By subscribing, you authorize
              Koolerr to charge your payment method on a recurring basis for the applicable plan
              fee.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">Billing</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Subscriptions are billed monthly in advance. Your billing cycle begins on the date you
              subscribe. Payments are processed by Stripe. By providing payment information, you
              agree to Stripe&apos;s{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:opacity-70"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://stripe.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:opacity-70"
              >
                Terms of Service
              </a>
              .
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">Plan changes</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You may upgrade your plan at any time; the new plan takes effect immediately and you
              will be charged a prorated amount for the remainder of the billing cycle. Downgrades
              take effect at the start of your next billing cycle.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">Cancellation and refunds</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You may cancel your subscription at any time from your Billing dashboard. Your access
              to the Service continues until the end of your current billing period. We do not offer
              prorated refunds for partial months upon cancellation, except where required by
              applicable law. If you believe you have been charged in error, contact us at
              team@koolerr.com within 30 days of the charge.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">Failed payments</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If a payment fails, we will attempt to retry the charge. If payment remains
              outstanding after reasonable retry attempts, we may suspend your access to the Service
              until payment is resolved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Intellectual property</h2>
            <h3 className="mt-4 text-base font-bold text-foreground">Your content</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You retain ownership of all content you upload to the Service — including Business
              Brain entries, Workforce configurations, and any content you provide as inputs. You
              grant Koolerr a limited, non-exclusive license to use your content solely to operate
              and improve the Service as described in our Privacy Policy.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">AI-generated deliverables</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Deliverables produced by your AI Workforce during Engagement Runs are owned by you,
              subject to any applicable laws regarding AI-generated content in your jurisdiction.
              You are responsible for ensuring that AI-generated content you publish or distribute
              complies with applicable laws and platform policies.
            </p>
            <h3 className="mt-4 text-base font-bold text-foreground">Koolerr platform</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Koolerr retains all rights to the platform, its architecture, software, design, and
              documentation. These Terms do not grant you any ownership interest in the Koolerr
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Confidentiality</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Koolerr treats your Business Brain content, Workforce configurations, and business
              data as confidential. We do not share, sell, or use your confidential information for
              any purpose other than operating the Service and as described in our Privacy Policy.
              Your data is isolated in a dedicated tenant environment and is not accessible to other
              customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Disclaimers</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI-generated content may contain errors, inaccuracies, or outputs that require human
              review before use. You are responsible for reviewing all AI deliverables before
              publishing or acting on them. Koolerr does not warrant that AI-generated content will
              be accurate, complete, or suitable for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Limitation of liability</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KOOLERR SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF
              PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES — ARISING OUT OF OR IN CONNECTION
              WITH YOUR USE OF THE SERVICE, EVEN IF KOOLERR HAS BEEN ADVISED OF THE POSSIBILITY OF
              SUCH DAMAGES.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              KOOLERR&apos;S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF THESE TERMS OR YOUR
              USE OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO KOOLERR IN THE 12 MONTHS
              PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">10. Indemnification</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You agree to indemnify, defend, and hold harmless Koolerr and its officers, directors,
              employees, and agents from and against any claims, damages, losses, liabilities,
              costs, and expenses (including reasonable legal fees) arising out of: (a) your use of
              the Service; (b) your violation of these Terms; (c) your violation of any third-party
              rights; or (d) content you submit to the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">11. Termination</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Either party may terminate this agreement at any time. You may terminate by cancelling
              your subscription and deleting your account. Koolerr may terminate or suspend your
              access immediately, without notice, if you violate these Terms or if we determine, in
              our sole discretion, that continued access poses a risk to the platform or other
              customers.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Upon termination, your right to access the Service ceases immediately. Provisions that
              by their nature should survive termination — including sections on intellectual
              property, disclaimers, limitation of liability, and indemnification — will survive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">12. Governing law and disputes</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              These Terms are governed by and construed in accordance with applicable laws. Any
              disputes arising under these Terms that cannot be resolved informally will be resolved
              through binding arbitration, except that either party may seek injunctive or other
              equitable relief in a court of competent jurisdiction to prevent irreparable harm.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Before initiating any formal dispute process, you agree to contact us at
              team@koolerr.com and provide 30 days for us to attempt informal resolution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">13. Changes to these terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We may update these Terms from time to time. When we make material changes, we will
              notify you by email at least 14 days before the changes take effect. Your continued
              use of the Service after the effective date constitutes your acceptance of the updated
              Terms. If you do not agree to the updated Terms, you must cancel your subscription
              before the effective date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">14. Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Questions about these Terms? Contact us:
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
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
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
