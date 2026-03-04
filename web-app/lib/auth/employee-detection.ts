/**
 * After Dark Systems Employee Detection
 * Automatically grants unlimited access to After Dark employees
 */

const AFTERDARK_DOMAINS = [
  'afterdarktech.com',
  'afterdarksystems.com',
  'aiserve.farm',
  'adstelco.io',
  'meowdel.ai',
]

const EMPLOYEE_BENEFITS = {
  subscriptionTier: 'roar', // Highest tier
  subscriptionStatus: 'active',
  role: 'afterdark_employee',
  isAfterDarkEmployee: true,
  messageLimit: -1, // Unlimited (-1)
  rateLimit: -1, // Unlimited
  storageLimit: -1, // Unlimited
  devicesLimit: -1, // Unlimited
}

export interface UserInfo {
  email: string
  oauthSub: string
  name?: string
  picture?: string
}

/**
 * Check if email belongs to After Dark employee
 */
export function isAfterDarkEmployee(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return AFTERDARK_DOMAINS.includes(domain)
}

/**
 * Get employee domain from email
 */
export function getEmployeeDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  return AFTERDARK_DOMAINS.includes(domain) ? domain : null
}

/**
 * Apply employee benefits to user data
 */
export function applyEmployeeBenefits(userInfo: UserInfo) {
  const domain = getEmployeeDomain(userInfo.email)

  if (domain) {
    return {
      ...userInfo,
      ...EMPLOYEE_BENEFITS,
      employeeDomain: domain,
    }
  }

  return userInfo
}

/**
 * Check if user has unlimited access
 */
export function hasUnlimitedAccess(user: {
  isAfterDarkEmployee?: boolean
  subscriptionTier?: string
}): boolean {
  return user.isAfterDarkEmployee === true || user.subscriptionTier === 'roar'
}

/**
 * Get usage limits for user
 */
export function getUserLimits(user: {
  isAfterDarkEmployee?: boolean
  subscriptionTier?: string
}): {
  messagesPerMonth: number
  requestsPerMinute: number
  devicesAllowed: number
  storageGB: number
} {
  // After Dark employees get unlimited everything
  if (user.isAfterDarkEmployee) {
    return {
      messagesPerMonth: -1, // -1 = unlimited
      requestsPerMinute: -1,
      devicesAllowed: -1,
      storageGB: -1,
    }
  }

  // Tier-based limits
  switch (user.subscriptionTier) {
    case 'roar':
      return {
        messagesPerMonth: -1, // Unlimited
        requestsPerMinute: 100,
        devicesAllowed: -1,
        storageGB: 500,
      }
    case 'meow':
      return {
        messagesPerMonth: 5000,
        requestsPerMinute: 50,
        devicesAllowed: 3,
        storageGB: 50,
      }
    case 'purr':
      return {
        messagesPerMonth: 1000,
        requestsPerMinute: 20,
        devicesAllowed: 1,
        storageGB: 5,
      }
    case 'free':
    default:
      return {
        messagesPerMonth: 100,
        requestsPerMinute: 10,
        devicesAllowed: 0, // No MeowConnect on free
        storageGB: 0,
      }
  }
}
