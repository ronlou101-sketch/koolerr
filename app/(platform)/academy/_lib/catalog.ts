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
    courseIds: ['getting-started', 'business-brain', 'ai-workforce', 'deliverables-approvals'],
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
