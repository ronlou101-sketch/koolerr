import Link from 'next/link'

export const dynamic = 'force-dynamic'

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Not Configured
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export default function InternalDocumentationPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Internal Docs</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Internal Documentation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Runbooks, architecture references, and operational procedures
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/20 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="text-sm font-medium text-muted-foreground">Not Configured</span>
        </div>
      </div>

      {/* Setup notice */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-5">
        <p className="text-sm font-medium text-foreground">
          Internal documentation is not yet connected
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect your internal documentation platform to surface key runbooks, incident procedures,
          and architecture references directly from Tower Control. Documentation health and coverage
          gaps will be tracked here.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Note: The codebase Foundation documents at <span className="font-mono">Foundation/</span>{' '}
          are the authoritative source for architecture decisions until a dedicated documentation
          platform is configured.
        </p>
      </div>

      {/* Documentation Areas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Documentation Areas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard
            title="Runbooks"
            description="Step-by-step procedures for recurring operational tasks: deployments, rollbacks, incident response, and customer provisioning."
          />
          <PlaceholderCard
            title="Architecture References"
            description="System diagrams, data flow documentation, and service dependency maps for the Koolerr platform."
          />
          <PlaceholderCard
            title="Incident Playbooks"
            description="Response procedures for defined incident types: database outage, billing failure, AI Workforce degradation, and security events."
          />
          <PlaceholderCard
            title="Onboarding Checklist"
            description="Internal checklist for onboarding new team members: access setup, system overview, and first-week tasks."
          />
          <PlaceholderCard
            title="Decision Log"
            description="Record of significant product, architecture, and business decisions with rationale. Supplements the Foundation ADR directory."
          />
          <PlaceholderCard
            title="Vendor Reference"
            description="Active vendor contracts, API keys location, account owners, and renewal dates for all platform dependencies."
          />
        </div>
      </section>

      {/* Existing Internal Docs */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Available Now</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-3 text-xs text-muted-foreground">
            The following internal documentation already exists in the codebase:
          </p>
          <ul className="space-y-2">
            {[
              {
                label: 'Foundation Charter',
                path: 'Foundation/FOUNDATION_000_CHARTER.md',
                desc: 'Governing authority, mission, and non-negotiable principles',
              },
              {
                label: 'Architecture Constitution',
                path: 'Foundation/FOUNDATION_001_ARCHITECTURE.md',
                desc: 'Platform architecture, domain boundaries, and permanent constraints',
              },
              {
                label: 'Engineering Principles',
                path: 'Foundation/FOUNDATION_002_ENGINEERING_PRINCIPLES.md',
                desc: 'How to build on this platform — patterns, standards, and practices',
              },
              {
                label: 'Development Roadmap',
                path: 'Foundation/FOUNDATION_003_DEVELOPMENT_ROADMAP.md',
                desc: 'Phased build sequence and milestone definitions',
              },
              {
                label: 'Architecture Decision Records',
                path: 'docs/adr/',
                desc: 'All ADRs documenting significant architectural decisions',
              },
            ].map((doc) => (
              <li key={doc.path} className="flex items-start gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-foreground">{doc.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{doc.path}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{doc.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Setup Guide</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Choose an internal documentation platform',
                detail:
                  'Recommended: Notion (flexible, easy), Confluence (structured, scalable), Outline (open-source), or continue in the codebase using Markdown.',
              },
              {
                step: '2',
                title: 'Migrate existing Foundation documents',
                detail:
                  'Export or link the Foundation documents and ADRs from the codebase into the chosen platform for discoverability.',
              },
              {
                step: '3',
                title: 'Create priority runbooks',
                detail:
                  'Start with: deployment procedure, incident response template, database restore procedure, and customer offboarding checklist.',
              },
              {
                step: '4',
                title: 'Connect to Tower Control',
                detail:
                  'Add the documentation platform API key to enable coverage metrics and stale document detection in this dashboard.',
              },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
