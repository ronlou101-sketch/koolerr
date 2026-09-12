/**
 * Koolerr Academy — content catalog (single source of truth for Academy content).
 *
 * Content is code-defined and static: no database, no schema, no migrations. Courses
 * contain modules, modules contain lessons, and every lesson carries the five required
 * teaching sections (Overview, Step-by-step walkthrough, Best practices, Common
 * mistakes, Troubleshooting). Lessons may optionally carry a HeyGen AI-instructor video
 * URL and downloadable resources. The model is designed for continual expansion — add
 * courses/modules/lessons here as new features ship.
 */

export interface LessonResource {
  label: string
  href: string
}

export interface TroubleshootingItem {
  problem: string
  solution: string
}

export interface LessonContent {
  overview: string
  /** Ordered step-by-step walkthrough. */
  walkthrough: string[]
  bestPractices: string[]
  commonMistakes: string[]
  troubleshooting: TroubleshootingItem[]
}

export interface Lesson {
  id: string
  title: string
  summary: string
  estimatedMinutes: number
  /** Optional HeyGen AI-instructor video URL. When absent the player shows a placeholder. */
  videoUrl?: string
  content: LessonContent
  resources?: LessonResource[]
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  description: string
  /** Who this course is primarily for. */
  audience: string
  /** Short icon/emoji for the catalog card. */
  icon: string
  modules: Module[]
}

/** A guided onboarding path recommending an ordered set of courses for a customer type. */
export interface OnboardingPath {
  id: string
  customerType: string
  title: string
  description: string
  /** Recommended course order. */
  courseIds: string[]
}

// ── Courses ──────────────────────────────────────────────────────────────────

export const COURSES: Course[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Koolerr',
    description:
      'Your first hour on Koolerr — set up your Business Brain and understand how the AI workforce produces work for you.',
    audience: 'Everyone — start here',
    icon: '🚀',
    modules: [
      {
        id: 'foundations',
        title: 'Foundations',
        lessons: [
          {
            id: 'what-is-koolerr',
            title: 'What is Koolerr?',
            summary: 'The core idea: stop buying software, start hiring an AI workforce.',
            estimatedMinutes: 5,
            videoUrl:
              'https://ofq9igptory9j22i.public.blob.vercel-storage.com/academy/what-is-koolerr.mp4',
            content: {
              overview:
                'Koolerr gives your business a team of AI employees — organized into Workforces — that read from a shared Business Brain and produce real Deliverables. Instead of operating another tool, you delegate outcomes to a workforce that works around the clock.',
              walkthrough: [
                'Sign in and land on your Dashboard — the window into your workforce.',
                'Open the Brain to see what Koolerr knows about your business.',
                'Launch the Pipeline to have your workforce produce content end-to-end.',
                'Review Deliverables and approve the ones you want to publish.',
              ],
              bestPractices: [
                'Treat Koolerr like a team you manage, not software you configure.',
                'Invest in your Business Brain early — everything downstream improves with it.',
              ],
              commonMistakes: [
                'Skipping onboarding and expecting on-brand output with no context.',
                'Trying to micromanage prompts instead of setting clear business goals.',
              ],
              troubleshooting: [
                {
                  problem: 'The dashboard looks empty.',
                  solution:
                    'Complete onboarding first — the Business Brain needs your business profile before the workforce can produce tailored work.',
                },
              ],
            },
            resources: [{ label: 'Open your Dashboard', href: '/dashboard' }],
          },
          {
            id: 'build-your-brain',
            title: 'Build Your Business Brain',
            summary: 'Complete the onboarding wizard so your workforce knows your business.',
            estimatedMinutes: 10,
            videoUrl:
              'https://ofq9igptory9j22i.public.blob.vercel-storage.com/academy/build-your-brain.mp4',
            content: {
              overview:
                'The Business Brain is your organization’s permanent memory — brand, services, audience, and strategy. Every Digital Employee reads from it. A strong Brain is the single biggest driver of output quality.',
              walkthrough: [
                'Go to Onboarding and open the Business Profile wizard.',
                'Fill in Business Info, Services, Audience, Brand Identity, and Strategy.',
                'Add your online presence and any additional notes.',
                'Review and launch — your profile is stored in the Brain as company identity.',
              ],
              bestPractices: [
                'Be specific about your audience and tone — vague inputs produce generic output.',
                'Return and enrich the Brain as your business evolves; it compounds over time.',
              ],
              commonMistakes: [
                'Leaving brand voice blank, then wondering why copy sounds off-brand.',
                'Entering a one-line description and expecting deep personalization.',
              ],
              troubleshooting: [
                {
                  problem: 'The wizard won’t let me continue.',
                  solution:
                    'Business name and business category are required. Fill both, then continue.',
                },
              ],
            },
            resources: [{ label: 'Start onboarding', href: '/onboarding' }],
          },
        ],
      },
    ],
  },
  {
    id: 'business-brain',
    title: 'Mastering the Business Brain',
    description:
      'Understand how the Brain stores knowledge, how the workforce reads it, and how to keep it healthy.',
    audience: 'Owners and operators',
    icon: '🧠',
    modules: [
      {
        id: 'brain-basics',
        title: 'Brain Basics',
        lessons: [
          {
            id: 'how-memory-works',
            title: 'How Business Memory Works',
            summary: 'Memory types, coverage, and why they matter.',
            estimatedMinutes: 7,
            videoUrl:
              'https://ofq9igptory9j22i.public.blob.vercel-storage.com/academy/how-memory-works.mp4',
            content: {
              overview:
                'The Brain stores discrete units of Business Memory across knowledge types (brand, product, service, pricing, policy, and more). Coverage across types is a signal of how well your workforce understands your business.',
              walkthrough: [
                'Open the Brain page to see your memories and type coverage.',
                'Review the Brain Health strip — coverage percentage and last update.',
                'Read the intelligence insights surfaced from your accumulated memory.',
                'Note any undocumented types and plan to fill the gaps.',
              ],
              bestPractices: [
                'Aim for coverage across all major knowledge types before scaling output.',
                'Let engagement runs enrich the Brain — completed work writes knowledge back.',
              ],
              commonMistakes: [
                'Treating the Brain as write-once; it is meant to grow continuously.',
                'Ignoring gap insights that point at missing knowledge.',
              ],
              troubleshooting: [
                {
                  problem: 'Coverage shows 0%.',
                  solution:
                    'You have no memories yet. Complete onboarding and run the pipeline once to seed the Brain.',
                },
              ],
            },
            resources: [{ label: 'Open the Brain', href: '/brain' }],
          },
        ],
      },
    ],
  },
  {
    id: 'ai-workforce',
    title: 'Running the AI Workforce',
    description:
      'Launch the pipeline, understand Engagement Runs, and read the 7-department production flow.',
    audience: 'Anyone producing content',
    icon: '⚙️',
    modules: [
      {
        id: 'pipeline',
        title: 'The Pipeline',
        lessons: [
          {
            id: 'launch-a-run',
            title: 'Launch Your First Engagement Run',
            summary: 'Trigger the workforce and watch it work through seven departments.',
            estimatedMinutes: 8,
            videoUrl:
              'https://ofq9igptory9j22i.public.blob.vercel-storage.com/academy/launch-a-run.mp4',
            content: {
              overview:
                'An Engagement Run sends your objective through the AI workforce: Research → Strategy → Creative → Video → Publishing → Approval → Delivery. Progress is written to the Brain so you can follow along, and a failure in one department no longer discards completed work.',
              walkthrough: [
                'Open Pipeline and launch a run.',
                'Follow progress on the Runs page; each department reports as it completes.',
                'If the Video step can’t produce a plan, the run skips it and continues.',
                'When the run completes, review the Deliverables it produced.',
              ],
              bestPractices: [
                'Give the run a clear, specific objective tied to a business outcome.',
                'Let runs finish before launching another for the same workforce.',
              ],
              commonMistakes: [
                'Launching many runs at once and hitting the daily run limit.',
                'Assuming a failed step means the whole run is lost — earlier work is retained.',
              ],
              troubleshooting: [
                {
                  problem: 'My run is marked failed.',
                  solution:
                    'Open the run to see which department failed and why. Fix the underlying issue (often a provider configuration) and relaunch.',
                },
                {
                  problem: 'I hit a daily limit.',
                  solution:
                    'There is a per-organization rolling 24-hour run cap to protect against runaway cost. Try again later or contact support to raise it.',
                },
              ],
            },
            resources: [
              { label: 'Launch the pipeline', href: '/pipeline' },
              { label: 'View your runs', href: '/runs' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'deliverables-approvals',
    title: 'Deliverables & Approvals',
    description: 'Find everything your workforce produces, review it, and approve what goes out.',
    audience: 'Reviewers and approvers',
    icon: '📦',
    modules: [
      {
        id: 'review',
        title: 'Review & Approve',
        lessons: [
          {
            id: 'review-deliverables',
            title: 'Review and Approve Deliverables',
            summary: 'Navigate the Deliverables library and the approval workflow.',
            estimatedMinutes: 6,
            videoUrl:
              'https://ofq9igptory9j22i.public.blob.vercel-storage.com/academy/review-deliverables.mp4',
            content: {
              overview:
                'Deliverables are the outputs your workforce produces — scripts, images, videos, reports, and strategic documents. The Deliverables page groups them by type; approvals let you review before anything is treated as final.',
              walkthrough: [
                'Open Deliverables to see media and Reports & Documents.',
                'Open any deliverable to review its full content.',
                'Use Approvals to review items awaiting your decision.',
                'Approve items you want to keep; reject the ones that miss the mark.',
              ],
              bestPractices: [
                'Review promptly — pending approvals are surfaced on your dashboard.',
                'Give rejection feedback so future output improves.',
              ],
              commonMistakes: [
                'Approving without reading full content.',
                'Expecting videos when the run skipped the Video department.',
              ],
              troubleshooting: [
                {
                  problem: 'The Reports & Documents section is empty.',
                  solution:
                    'Documents appear after a pipeline run completes and delivers them. Launch a run first.',
                },
              ],
            },
            resources: [
              { label: 'Open Deliverables', href: '/deliverables' },
              { label: 'Open Approvals', href: '/approvals' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'campaign-architect',
    title: 'Campaign Architect',
    description:
      'Use the in-platform campaign wizard — AI Campaign Architect — to set a goal, add optional focus, create a campaign, and review the work your marketing team produces.',
    audience: 'Anyone launching a campaign',
    icon: '🎯',
    modules: [
      {
        id: 'campaign-wizard',
        title: 'The Campaign Wizard',
        lessons: [
          {
            id: 'meet-campaign-architect',
            title: 'Meet Campaign Architect',
            summary: 'What the in-platform campaign wizard does and when to open it.',
            estimatedMinutes: 5,
            content: {
              overview:
                'Campaign Architect is the in-platform campaign wizard. From Campaigns, New campaign opens a guided conversation: you name the outcome you want, optionally add focus, and your marketing team researches, plans, and produces the work. You manage the outcome — you do not configure a pipeline.',
              walkthrough: [
                'Open Campaigns — the everyday place to start and follow campaigns.',
                'Choose New campaign to open the Campaign Architect wizard.',
                'Read the opening question: what you want your marketing team to do.',
                'Leave the wizard if you only wanted to browse existing campaigns — nothing is created until you confirm.',
              ],
              bestPractices: [
                'Start from Campaigns so the new work appears on the same list you already watch.',
                'Open the wizard when you have a concrete outcome in mind, not a vague “make marketing.”',
              ],
              commonMistakes: [
                'Looking for a separate Campaign Architect app — the wizard lives inside Campaigns.',
                'Expecting the wizard to publish immediately; it creates work for you to review first.',
              ],
              troubleshooting: [
                {
                  problem: 'I cannot find New campaign.',
                  solution:
                    'Open Campaigns in the primary navigation. New campaign is the entry on that page. Bookmarks to the older start page still host the same wizard.',
                },
              ],
            },
            resources: [{ label: 'Open Campaigns', href: '/runs' }],
          },
          {
            id: 'pick-a-campaign-goal',
            title: 'Pick a Campaign Goal',
            summary: 'Choose a guided goal so the team knows the outcome you want.',
            estimatedMinutes: 6,
            content: {
              overview:
                'The first field in Campaign Architect is a one-tap goal. Presets cover leads, phone calls, appointments, a specific service, brand awareness, and repeat customers. “Something else…” is the only path that reveals a free-text outcome. The selected goal becomes the assignment your marketing team receives.',
              walkthrough: [
                'Open New campaign so the goal list is visible.',
                'Tap the outcome that matches what you want — more leads, more calls, more appointments, promote a service, build awareness, or increase repeat customers.',
                'If none fit, choose Something else… and write the outcome in your own words.',
                'Confirm a goal is selected before you look at optional focus — Create campaign stays unavailable until a goal exists.',
              ],
              bestPractices: [
                'Prefer a preset when it already states the outcome; presets are clearer than a long custom sentence.',
                'When you use Something else…, write a single outcome (for example weekend bookings), not a list of tactics.',
              ],
              commonMistakes: [
                'Skipping the goal and hoping optional focus will carry the assignment — the wizard requires a goal.',
                'Writing a custom goal that describes tools or steps instead of the business result.',
              ],
              troubleshooting: [
                {
                  problem: 'Create campaign stays disabled.',
                  solution:
                    'Select a preset goal, or choose Something else… and type a non-empty outcome. The wizard will not start without that assignment.',
                },
              ],
            },
            resources: [{ label: 'Open Campaigns', href: '/runs' }],
          },
          {
            id: 'add-optional-focus',
            title: 'Add Optional Focus',
            summary: 'Give extra context — audience, location, timing, or offer — before you create.',
            estimatedMinutes: 5,
            content: {
              overview:
                'After the goal, Campaign Architect offers an optional focus field: anything you want the team to weigh — audience, location, timing, promotion, budget, or seasonality. It is extra context, not a second goal. Leave it blank when the goal already says enough.',
              walkthrough: [
                'Keep your selected goal in place.',
                'If you have a constraint or emphasis, add it in the optional focus field.',
                'Use short, concrete notes (who, where, when, or which offer) rather than restating the goal.',
                'Leave the field empty when you do not have extra context — that is valid.',
              ],
              bestPractices: [
                'Add focus only when it changes the work: a neighborhood, a weekend window, a specific offer.',
                'Finish your business profile before you rely on the wizard; missing profile details are a common reason a create attempt cannot start.',
              ],
              commonMistakes: [
                'Pasting a long brief that contradicts the selected goal.',
                'Treating optional focus as required and blocking yourself when you have nothing extra to say.',
              ],
              troubleshooting: [
                {
                  problem: 'The wizard asks me to finish my business profile first.',
                  solution:
                    'Complete the business profile, then return to Campaigns and open New campaign again. The team needs that profile before it can start.',
                },
              ],
            },
            resources: [{ label: 'Start onboarding', href: '/onboarding' }],
          },
          {
            id: 'create-and-follow-progress',
            title: 'Create the Campaign and Follow Progress',
            summary: 'Start the campaign and watch the marketing team research, plan, and produce.',
            estimatedMinutes: 7,
            content: {
              overview:
                'Create campaign hands your goal (and optional focus) to the marketing team. You should see a short “getting started” state, then live progress: researching your market, planning the campaign, and creating content. A typical run takes a few minutes. Stay on the wizard or return to Campaigns — the work continues either way.',
              walkthrough: [
                'Confirm your goal (and optional focus, if any), then choose Create campaign.',
                'Wait through the brief getting-started state; do not tap Create campaign again.',
                'Watch the progress narration until the team finishes or you choose to leave.',
                'If you leave, reopen Campaigns to see the new item on the list while it is still working.',
              ],
              bestPractices: [
                'Give one clear assignment and let the run finish before starting another for the same outcome.',
                'Use the progress states as a status readout, not as a place to edit the goal mid-run.',
              ],
              commonMistakes: [
                'Starting several campaigns at once and hitting the daily create limit.',
                'Assuming a quiet progress view means nothing happened — check Campaigns for the new item.',
              ],
              troubleshooting: [
                {
                  problem: 'Create campaign returns a friendly error and nothing starts.',
                  solution:
                    'Try again in a moment. If the wizard suggests finishing your business profile, do that first. If you recently started several campaigns, wait for the rolling daily limit to reset.',
                },
                {
                  problem: 'The campaign did not finish.',
                  solution:
                    'Open the campaign details from Campaigns. Earlier work is kept when a later step cannot complete; fix the surfaced issue and start a new campaign if you still need the outcome.',
                },
              ],
            },
            resources: [{ label: 'Open Campaigns', href: '/runs' }],
          },
          {
            id: 'review-campaign-work',
            title: 'Review the Work After Launch',
            summary: 'Open the finished work, see campaign details, or start another campaign.',
            estimatedMinutes: 6,
            content: {
              overview:
                'When Campaign Architect finishes, the wizard offers a handoff: review the work, see the campaign details, or start another campaign. Review is where you accept or send back what the team produced. Nothing is treated as final until you decide.',
              walkthrough: [
                'When the wizard says the work is ready, choose Review it to open the produced pieces.',
                'Or choose See the details to open the campaign record you just created.',
                'Approve items you want to keep; send back the ones that miss the mark.',
                'Use Start another campaign only when you have a new outcome — it resets the wizard.',
              ],
              bestPractices: [
                'Review promptly so pending items do not pile up on Home.',
                'Say why you send work back; the next campaign improves when the miss is specific.',
              ],
              commonMistakes: [
                'Approving without opening the full piece.',
                'Expecting a video on every campaign — some runs skip video and still deliver the rest.',
              ],
              troubleshooting: [
                {
                  problem: 'I closed the wizard and cannot find the finished work.',
                  solution:
                    'Open Deliverables for the pieces, or Campaigns for the campaign record. Both remain after the wizard closes.',
                },
              ],
            },
            resources: [
              { label: 'Open Deliverables', href: '/deliverables' },
              { label: 'Open Campaigns', href: '/runs' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing, Plans & Subscription',
    description:
      'Use in-platform Plans to see your current subscription, compare BUILD / GROW / SCALE, start or change a plan, and manage billing.',
    audience: 'Anyone choosing or managing a plan',
    icon: '💳',
    modules: [
      {
        id: 'plans-and-subscription',
        title: 'Plans & Subscription',
        lessons: [
          {
            id: 'open-plans',
            title: 'Open Plans and See Your Current Plan',
            summary: 'Find Plans and read the plan you already have — before you change anything.',
            estimatedMinutes: 5,
            content: {
              overview:
                'Billing lives on the in-platform Plans page. That is where you see BUILD, GROW, and SCALE, plus — when you already have a paid plan — a Your Plan summary with status and renewal date. Open Plans to learn what you have today. Nothing changes until you start, switch, or cancel.',
              walkthrough: [
                'Open Billing from More — the page title is Plans.',
                'Read the intro: every package is a hired AI marketing team, not another software license.',
                'If you already have a paid plan, read the Your Plan card: plan name, status, and when it renews.',
                'If you do not have a paid plan yet, skip ahead to the three package cards — you are choosing a first plan, not managing one.',
              ],
              bestPractices: [
                'Start on Plans so you can see your current plan and the three packages on the same page.',
                'Note your renewal date before you change or cancel — access follows that date.',
              ],
              commonMistakes: [
                'Looking for a separate Billing app — Plans is the billing page.',
                'Assuming the package cards will change your plan just by opening them — nothing starts until you confirm a button.',
              ],
              troubleshooting: [
                {
                  problem: 'I cannot find Billing.',
                  solution:
                    'Open More in the primary navigation and choose Billing. The page heading is Plans.',
                },
                {
                  problem: 'I do not see a Your Plan card.',
                  solution:
                    'That card appears only when you already have a paid plan. Without one, use the package cards to start.',
                },
              ],
            },
            resources: [{ label: 'Open Plans', href: '/billing' }],
          },
          {
            id: 'compare-build-grow-scale',
            title: 'Compare BUILD, GROW, and SCALE',
            summary: 'Read the three packages and the comparison table before you pick.',
            estimatedMinutes: 7,
            content: {
              overview:
                'Plans shows three packages: BUILD ($99 / month) to start a small AI marketing team, GROW ($499 / month) as the recommended Best Value for most businesses, and SCALE ($1,499 / month) for larger operations. A Compare Plans table lines up employees, monthly assets, spokesperson videos, and support so you can choose by outcome — not by guessing.',
              walkthrough: [
                'Stay on Plans and scan the three package cards: BUILD, GROW, and SCALE.',
                'Read each card’s “What you get” line and the feature groups under it.',
                'Open Compare Plans and read the rows that matter for you — employees, monthly assets, spokesperson videos, and support.',
                'Treat GROW as the default recommendation unless you know you need a smaller start (BUILD) or a larger operation (SCALE).',
              ],
              bestPractices: [
                'Match the package to the work you want this month, not to a future maybe.',
                'Use the comparison table when the cards feel similar — the rows make the limits explicit.',
              ],
              commonMistakes: [
                'Choosing SCALE because it is the largest card without needing multiple organizations or a dedicated CTO Agent.',
                'Ignoring the asset and spokesperson-video limits, then wondering why a month of work hits a cap.',
              ],
              troubleshooting: [
                {
                  problem: 'I am not sure what an AI Marketing Asset is.',
                  solution:
                    'On Plans, the note under Compare Plans defines it: one piece of AI-produced content (a post, article, email, landing page, or ad). Spokesperson videos count separately.',
                },
              ],
            },
            resources: [{ label: 'Open Plans', href: '/billing' }],
          },
          {
            id: 'start-or-change-plan',
            title: 'Start or Change Your Plan',
            summary: 'Start a first plan, or switch the plan you already have.',
            estimatedMinutes: 6,
            content: {
              overview:
                'If you do not have a paid plan yet, the package you want shows a start button (Start Hiring AI, Grow My AI Team, or Scale My AI Team). If you already have a subscription, those buttons become a plan change: upgrade copy on a higher package, or Switch to BUILD / GROW / SCALE on a lower one. Your current package shows Your Current Plan and will not start another checkout.',
              walkthrough: [
                'Confirm which package is marked Current — that is the plan you already have.',
                'To start a first plan, choose the package button and finish the checkout steps that open.',
                'To change an existing plan, choose the higher package’s start button or Switch to the package you want.',
                'Wait for Plans to refresh. A successful change shows “Your plan is updated. Your marketing team is ready.”',
              ],
              bestPractices: [
                'Change one plan at a time and wait for the confirmation before tapping again.',
                'Prefer GROW when you are unsure — it is marked Best Value for most businesses.',
              ],
              commonMistakes: [
                'Tapping a start button twice while checkout is still opening.',
                'Expecting the Current card to start a new subscription — that card is a status, not an action.',
              ],
              troubleshooting: [
                {
                  problem: 'The package button says we could not change the plan.',
                  solution:
                    'Try once more in a moment. Stay on Plans so you can see whether Your Plan updated. If payments are not active yet, the cards will say so and no charge starts.',
                },
                {
                  problem: 'I do not see a start or switch button.',
                  solution:
                    'If the card says Your Current Plan, you are already on that package. If it says payments are not active, you cannot start or change a plan from here yet.',
                },
              ],
            },
            resources: [{ label: 'Open Plans', href: '/billing' }],
          },
          {
            id: 'manage-billing',
            title: 'Manage Billing and Renewals',
            summary: 'Update payment details and read when the plan renews — without changing the package.',
            estimatedMinutes: 5,
            content: {
              overview:
                'When you have a paid plan, the Your Plan card shows status and the renewal date. Manage Billing opens the billing portal for payment method and invoice details. Use it when you need to update a card or read a receipt. It does not pick a different package — that still happens on the Plans cards.',
              walkthrough: [
                'Open Plans and find the Your Plan card.',
                'Read the status and the Renews date so you know the current period.',
                'Choose Manage Billing if you need to update payment details or review invoices.',
                'Return to Plans when you are done — your package is unchanged unless you also used a plan-change button.',
              ],
              bestPractices: [
                'Keep payment details current before the renewal date so the plan continues without a gap.',
                'Use Manage Billing for payment and invoices; use the package cards only when you intend to change the plan.',
              ],
              commonMistakes: [
                'Opening Manage Billing when you meant to switch BUILD, GROW, or SCALE.',
                'Ignoring a past-due status and trying to start more campaigns instead of updating payment details.',
              ],
              troubleshooting: [
                {
                  problem: 'I do not see Manage Billing.',
                  solution:
                    'That control appears on the Your Plan card after you have a paid plan with billing details on file. Start a plan first if the card is missing.',
                },
              ],
            },
            resources: [{ label: 'Open Plans', href: '/billing' }],
          },
          {
            id: 'cancel-subscription',
            title: 'Cancel a Subscription and Troubleshoot',
            summary: 'End the plan at the period date, or recover when a billing action does not finish.',
            estimatedMinutes: 6,
            content: {
              overview:
                'Cancel subscription sits on the Your Plan card when you have an active paid plan. Canceling is at period end: you keep access until the renewal date shown, then the plan stops. You will be asked to confirm (Yes, cancel) or keep the plan. Use this only when you intend to stop — switching packages is a plan change, not a cancel.',
              walkthrough: [
                'Open Plans and confirm the Your Plan renewal date — that is when access would end.',
                'Choose Cancel subscription, then read the confirmation that access continues until that date.',
                'Choose Yes, cancel to schedule the end, or Keep plan to leave everything as it is.',
                'After a successful cancel, Plans tells you the subscription will end on that date and access continues until then.',
              ],
              bestPractices: [
                'If you only need a smaller package, switch plans instead of canceling and starting over.',
                'Read the period-end date before you confirm — cancel does not cut access the same day.',
              ],
              commonMistakes: [
                'Canceling because you wanted GROW instead of BUILD — use Switch to / the upgrade button for that.',
                'Confirming cancel twice, or leaving the page before the confirmation message appears.',
              ],
              troubleshooting: [
                {
                  problem: 'Cancel says we could not update your plan.',
                  solution:
                    'Try again in a moment. If it still fails, use Manage Billing to review the subscription, then return to Plans.',
                },
                {
                  problem: 'I canceled and still have access.',
                  solution:
                    'That is expected until the renewal date on Your Plan. Access continues through the paid period, then the plan ends.',
                },
                {
                  problem: 'I do not see Cancel subscription.',
                  solution:
                    'Cancel appears only for an active paid plan that is not already canceled. If you have not started a plan, there is nothing to cancel.',
                },
              ],
            },
            resources: [{ label: 'Open Plans', href: '/billing' }],
          },
        ],
      },
    ],
  },
]

// ── Onboarding paths (guided sequences by customer type) ──────────────────────

export const ONBOARDING_PATHS: OnboardingPath[] = [
  {
    id: 'founder',
    customerType: 'Founder / Solo',
    title: 'Founder Fast-Start',
    description:
      'Get from zero to your first published deliverable quickly, then learn to keep the Brain healthy.',
    courseIds: ['getting-started', 'ai-workforce', 'deliverables-approvals'],
  },
  {
    id: 'marketer',
    customerType: 'Content Marketer',
    title: 'Content Marketer Path',
    description: 'Focus on producing on-brand content at volume and reviewing it efficiently.',
    courseIds: ['getting-started', 'business-brain', 'ai-workforce', 'deliverables-approvals', 'campaign-architect'],
  },
  {
    id: 'operator',
    customerType: 'Operator / Reviewer',
    title: 'Operator Path',
    description: 'Understand the Brain and own the review-and-approve workflow.',
    courseIds: ['getting-started', 'business-brain', 'deliverables-approvals'],
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId)
}

/** All lessons of a course in order, flattened across modules. */
export function courseLessons(course: Course): Lesson[] {
  return course.modules.flatMap((m) => m.lessons)
}

export function getLesson(
  courseId: string,
  lessonId: string
): { course: Course; module: Module; lesson: Lesson } | undefined {
  const course = getCourse(courseId)
  if (!course) return undefined
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId)
    if (lesson) return { course, module: mod, lesson }
  }
  return undefined
}

/** A globally-unique key for a lesson, used as the progress identifier. */
export function lessonKey(courseId: string, lessonId: string): string {
  return `${courseId}/${lessonId}`
}

/** Every lesson key across the whole catalog (for overall progress). */
export function allLessonKeys(): string[] {
  return COURSES.flatMap((c) => courseLessons(c).map((l) => lessonKey(c.id, l.id)))
}
