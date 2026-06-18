import { ApprovalWorkflowService } from './service'
import { InMemoryApprovalRepository } from './in-memory-repository'

/**
 * Returns a fresh ApprovalWorkflowService backed by an in-memory repository.
 * Used in unit tests to get a clean, isolated service instance.
 */
export function makeApprovalService() {
  const repo = new InMemoryApprovalRepository()
  const service = new ApprovalWorkflowService(repo)
  return { service, repo }
}
