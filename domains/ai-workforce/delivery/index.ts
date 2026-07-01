/**
 * Delivery Department — Public Interface
 *
 * The Delivery Department is the seventh active AI department in the AI Workforce.
 * It consumes an ApprovalDecision and produces a DeliveryJob containing a
 * DeliveryPackage ready for display on the customer dashboard.
 *
 * Workflow position: final stage — after Research → Strategy → Creative →
 * Video Production → Publishing → Approval → Delivery.
 *
 * The Delivery Department prepares customer-ready deliverables only.
 * It does NOT publish directly to Facebook, Instagram, TikTok, YouTube,
 * LinkedIn, or Google Business Profile. Platform API integrations belong
 * to a later phase.
 *
 * Package generation: OpenAI (primary) / Anthropic (fallback) via buildProviderOrder()
 * Employee: delivery-manager (delivery department)
 *
 * Usage:
 *   import { deliveryDepartment } from '@/domains/ai-workforce/delivery'
 *   const result = await deliveryDepartment.prepareDelivery(request)
 */

export type {
  DeliveryStatus,
  DeliveryPackage,
  DeliveryJob,
  DeliveryJobStatus,
  DeliveryError,
  DeliveryErrorCode,
  DeliveryRequest,
  DeliveryDepartmentHealth,
  DeliveryProviderReadiness,
  DeliveryProviderStatus,
} from './types'

export type { IDeliveryDepartmentService } from './service'
export { DeliveryDepartmentService, deliveryDepartment } from './service'
export { buildDeliveryPrompt, parseDeliveryPackage, DELIVERY_SYSTEM_CONTEXT } from './prompt'
export { getDeliveryDepartmentHealth } from './health'
