import { businessBrainService } from '@/domains/business-brain'
import type { BusinessProfile } from '@/domains/ai-workforce/research'
import type { OrganizationId } from '@/shared/types'

/**
 * Rebuilds a BusinessProfile from Brain memories written by the AI Workforce wizard.
 * Looks for the most recent company_identity memory tagged source='ai-workforce-wizard'.
 * Returns null if no wizard profile has been stored yet.
 */
export async function buildBusinessProfileFromMemories(
  organizationId: OrganizationId
): Promise<BusinessProfile | null> {
  const result = await businessBrainService.listAllMemories(organizationId)
  if (!result.ok) return null

  const wizardMemory = result.value
    .filter((m) => m.source === 'ai-workforce-wizard' && m.type === 'company_identity')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

  if (!wizardMemory) return null

  const c = wizardMemory.content as Record<string, unknown>

  const notes: string[] = []
  if (c.industry) notes.push(`Industry: ${c.industry}`)
  if (c.primaryService) notes.push(`Primary service: ${c.primaryService}`)
  if (c.additionalServices) notes.push(`Additional services: ${c.additionalServices}`)
  if (c.targetAudience) notes.push(`Target audience: ${c.targetAudience}`)
  if (c.idealCustomer) notes.push(`Ideal customer: ${c.idealCustomer}`)
  if (c.brandVoice) notes.push(`Brand voice: ${c.brandVoice}`)
  if (c.brandPersonality) notes.push(`Brand personality: ${c.brandPersonality}`)
  if (c.competitiveAdvantages) notes.push(`Competitive advantages: ${c.competitiveAdvantages}`)
  if (c.businessGoals) notes.push(`Business goals: ${c.businessGoals}`)
  if (Array.isArray(c.preferredPlatforms) && c.preferredPlatforms.length > 0) {
    notes.push(`Preferred platforms: ${(c.preferredPlatforms as string[]).join(', ')}`)
  }
  if (c.contactEmail) notes.push(`Contact email: ${c.contactEmail}`)

  return {
    businessName: String(c.businessName ?? ''),
    businessCategory: String(c.businessCategory ?? ''),
    location: String(c.location ?? ''),
    website: c.website ? String(c.website) : undefined,
    serviceArea: c.serviceArea ? String(c.serviceArea) : undefined,
    notes: notes.length > 0 ? notes.join('. ') : undefined,
  }
}
