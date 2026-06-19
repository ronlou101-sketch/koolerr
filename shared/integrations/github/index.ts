import { logger } from '@/shared/lib/logger'

/**
 * GitHub Integration — Issue Creation
 *
 * The only GitHub capability in Phase 3: creating issues from CTO Agent
 * coordination briefs. All other GitHub coordination (PR creation, milestone
 * management, webhook receivers) is deferred to Phase 4.
 *
 * Authentication: GITHUB_TOKEN environment variable (Personal Access Token
 * or GitHub App installation token with issues:write scope).
 * Never stored in code or version control. See FOUNDATION_002 §Secrets.
 *
 * Owner/repo: GITHUB_REPO_OWNER and GITHUB_REPO_NAME environment variables.
 * Default: ronlou101-sketch / koolerr (Koolerr's own repository).
 *
 * See docs/adr/ADR-019-cross-workforce-engagement-runs.md
 */

export interface GitHubIssueResult {
  url: string
  number: number
  title: string
}

export interface CreateIssueParams {
  title: string
  body: string
  labels?: string[]
}

/**
 * Create a GitHub issue from a CTO Agent coordination brief.
 * Returns null if GITHUB_TOKEN is not set or the request fails.
 * Never throws — GitHub integration is non-fatal for the run.
 */
export async function createGitHubIssue(
  params: CreateIssueParams
): Promise<GitHubIssueResult | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER ?? 'ronlou101-sketch'
  const repo = process.env.GITHUB_REPO_NAME ?? 'koolerr'

  if (!token) {
    logger.info('[GITHUB] GITHUB_TOKEN not set — skipping issue creation')
    return null
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        labels: params.labels ?? ['atlas', 'cto-agent'],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      logger.warn('[GITHUB] Issue creation failed', {
        status: response.status,
        body: text.slice(0, 200),
      })
      return null
    }

    const data = (await response.json()) as { html_url: string; number: number; title: string }
    logger.info('[GITHUB] Issue created', { url: data.html_url, number: data.number })
    return { url: data.html_url, number: data.number, title: data.title }
  } catch (error) {
    logger.warn('[GITHUB] Issue creation threw an error', { error: String(error) })
    return null
  }
}
