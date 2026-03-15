/**
 * Environment Variable Validation
 * Validates all required environment variables at application startup
 * Prevents runtime errors from missing configuration
 */

export interface EnvironmentConfig {
  // Database
  databaseUrl: string;

  // Authentication & Security
  jwtSecret: string;
  sessionSecret: string;
  encryptionKey: string;

  // OAuth2
  oauth2ClientId: string;
  oauth2ClientSecret: string;
  oauth2IssuerUrl: string;
  oauth2RedirectUri: string;

  // AI Services
  anthropicApiKey: string;
  openaiApiKey?: string;

  // Optional Services
  elevenLabsApiKey?: string;
  ultravoxApiKey?: string;
  telnyxApiKey?: string;
  telnyxConnectionId?: string;
  telnyxPhoneNumber?: string;
  falAiKey?: string;

  // Stripe (optional for freemium)
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;

  // Application
  nodeEnv: 'development' | 'production' | 'test';
  nextPublicAppUrl: string;
}

/**
 * Required environment variables that must be present
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'OAUTH2_CLIENT_ID',
  'OAUTH2_CLIENT_SECRET',
  'OAUTH2_ISSUER_URL',
  'OAUTH2_REDIRECT_URI',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * Optional environment variables with warnings if missing
 */
const OPTIONAL_ENV_VARS = [
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'ULTRAVOX_API_KEY',
  'TELNYX_API_KEY',
  'TELNYX_CONNECTION_ID',
  'TELNYX_PHONE_NUMBER',
  'FAL_AI_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

/**
 * Validate that a string is non-empty
 */
function validateNonEmpty(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set or empty`);
  }
  return value;
}

/**
 * Validate and parse all environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // If there are missing required variables, throw immediately
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    );
  }

  // Warn about missing optional variables (only in production)
  if (process.env.NODE_ENV === 'production') {
    const warnings: string[] = [];
    for (const varName of OPTIONAL_ENV_VARS) {
      if (!process.env[varName]) {
        warnings.push(`Optional environment variable not set: ${varName}`);
      }
    }

    if (warnings.length > 0) {
      console.warn('[ENV] Optional variables not configured (some features may be disabled):');
      warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test.`);
  }

  // Return validated config
  return {
    // Database
    databaseUrl: validateNonEmpty(process.env.DATABASE_URL, 'DATABASE_URL'),

    // Authentication & Security
    jwtSecret: validateNonEmpty(process.env.JWT_SECRET, 'JWT_SECRET'),
    sessionSecret: validateNonEmpty(process.env.SESSION_SECRET, 'SESSION_SECRET'),
    encryptionKey: validateNonEmpty(process.env.ENCRYPTION_KEY, 'ENCRYPTION_KEY'),

    // OAuth2
    oauth2ClientId: validateNonEmpty(process.env.OAUTH2_CLIENT_ID, 'OAUTH2_CLIENT_ID'),
    oauth2ClientSecret: validateNonEmpty(process.env.OAUTH2_CLIENT_SECRET, 'OAUTH2_CLIENT_SECRET'),
    oauth2IssuerUrl: validateNonEmpty(process.env.OAUTH2_ISSUER_URL, 'OAUTH2_ISSUER_URL'),
    oauth2RedirectUri: validateNonEmpty(process.env.OAUTH2_REDIRECT_URI, 'OAUTH2_REDIRECT_URI'),

    // AI Services
    anthropicApiKey: validateNonEmpty(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
    openaiApiKey: process.env.OPENAI_API_KEY,

    // Optional Services
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    ultravoxApiKey: process.env.ULTRAVOX_API_KEY,
    telnyxApiKey: process.env.TELNYX_API_KEY,
    telnyxConnectionId: process.env.TELNYX_CONNECTION_ID,
    telnyxPhoneNumber: process.env.TELNYX_PHONE_NUMBER,
    falAiKey: process.env.FAL_AI_KEY,

    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    // Application
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    nextPublicAppUrl: validateNonEmpty(process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL'),
  };
}

/**
 * Cached environment config (validated once at startup)
 */
let cachedEnv: EnvironmentConfig | null = null;

/**
 * Get validated environment config (singleton)
 */
export function getEnvironment(): EnvironmentConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnvironment();
  }
  return cachedEnv;
}

/**
 * Validate environment on module load (fail fast)
 * Only validate in production or if explicitly requested
 */
if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
  try {
    validateEnvironment();
    console.log('[ENV] Environment validation successful');
  } catch (error: any) {
    console.error('[ENV] Environment validation failed:', error.message);
    process.exit(1);
  }
}
