/**
 * BrowserID Fingerprinting Library
 * Generates unique, persistent browser fingerprints
 * Based on webbrowsers.id technology
 */

interface FingerprintComponents {
  userAgent: string;
  language: string;
  languages: readonly string[];
  platform: string;
  screenResolution: string;
  screenColorDepth: number;
  timezone: string;
  timezoneOffset: number;

  // Canvas fingerprint
  canvasFingerprint: string;

  // WebGL fingerprint
  webglVendor: string;
  webglRenderer: string;

  // Audio context fingerprint
  audioFingerprint: string;

  // Available fonts (sample)
  fontFingerprint: string;

  // Hardware concurrency
  hardwareConcurrency: number;

  // Device memory
  deviceMemory?: number;

  // Touch support
  touchSupport: boolean;

  // Cookie enabled
  cookieEnabled: boolean;

  // Do Not Track
  doNotTrack: string | null;

  // WebDriver detection
  webdriver: boolean;
}

interface BrowserIDResult {
  browserID: string;
  components: FingerprintComponents;
  confidence: number;
  timestamp: string;
}

/**
 * Generate canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with multiple styles
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('BrowserID 🐱', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Meowdel.ai', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

/**
 * Generate WebGL fingerprint
 */
function getWebGLFingerprint(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return { vendor: 'no-webgl', renderer: 'no-webgl' };
    }

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
        renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown'
      };
    }

    return {
      vendor: (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).VENDOR) || 'unknown',
      renderer: (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER) || 'unknown'
    };
  } catch (e) {
    return { vendor: 'webgl-error', renderer: 'webgl-error' };
  }
}

/**
 * Generate audio context fingerprint (LIGHTWEIGHT VERSION)
 */
function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    // SKIP AUDIO FINGERPRINTING - too expensive for performance
    // Just use basic AudioContext properties if available
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve('no-audio');
        return;
      }

      // Just check if audio is available, don't actually process
      resolve('audio-available');
    } catch (e) {
      resolve('audio-error');
    }
  });
}

/**
 * Detect available fonts (LIGHTWEIGHT VERSION)
 */
function getFontFingerprint(): string {
  // SIMPLIFIED: Only check 3 common fonts for performance
  const testFonts = ['Arial', 'Times New Roman', 'Courier New'];

  const baseFonts = ['monospace'];
  const testString = 'mmlli';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return 'no-canvas';

  ctx.font = `72px monospace`;
  const baseWidth = ctx.measureText(testString).width;

  // Quick check - just see if fonts differ from monospace
  const availableFonts = testFonts.filter(font => {
    ctx.font = `72px "${font}", monospace`;
    const width = ctx.measureText(testString).width;
    return width !== baseWidth;
  });

  return availableFonts.join(',');
}

/**
 * Hash components to generate BrowserID
 */
async function hashComponents(components: FingerprintComponents): Promise<string> {
  const data = JSON.stringify(components);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Collect all fingerprint components
 */
async function collectComponents(): Promise<FingerprintComponents> {
  const webgl = getWebGLFingerprint();
  const audioFingerprint = await getAudioFingerprint();

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    canvasFingerprint: getCanvasFingerprint(),

    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,

    audioFingerprint,

    fontFingerprint: getFontFingerprint(),

    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,

    touchSupport: 'ontouchstart' in window,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || null,
    webdriver: (navigator as any).webdriver || false,
  };
}

/**
 * Generate BrowserID
 */
export async function generateBrowserID(): Promise<BrowserIDResult> {
  const components = await collectComponents();
  const browserID = await hashComponents(components);

  // Calculate confidence based on available components
  let availableComponents = 0;
  let totalComponents = 0;

  for (const [key, value] of Object.entries(components)) {
    totalComponents++;
    if (value && value !== 'no-canvas' && value !== 'no-webgl' &&
        value !== 'no-audio' && !key.includes('error')) {
      availableComponents++;
    }
  }

  const confidence = (availableComponents / totalComponents) * 100;

  return {
    browserID,
    components,
    confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get or create BrowserID (with caching)
 */
export async function getBrowserID(): Promise<string> {
  // Check sessionStorage first for performance
  const cached = sessionStorage.getItem('meowdel_browserid');
  if (cached) {
    const { browserID, timestamp } = JSON.parse(cached);
    // Cache for 1 hour
    if (Date.now() - new Date(timestamp).getTime() < 3600000) {
      return browserID;
    }
  }

  // Generate fresh fingerprint
  const result = await generateBrowserID();

  // Cache in sessionStorage
  sessionStorage.setItem('meowdel_browserid', JSON.stringify({
    browserID: result.browserID,
    timestamp: result.timestamp
  }));

  return result.browserID;
}

/**
 * Enhanced getBrowserID with full result
 */
export async function getBrowserIDFull(): Promise<BrowserIDResult> {
  const cached = sessionStorage.getItem('meowdel_browserid_full');
  if (cached) {
    const result = JSON.parse(cached);
    if (Date.now() - new Date(result.timestamp).getTime() < 3600000) {
      return result;
    }
  }

  const result = await generateBrowserID();
  sessionStorage.setItem('meowdel_browserid_full', JSON.stringify(result));

  return result;
}

/**
 * Clear cached BrowserID (for testing)
 */
export function clearBrowserIDCache(): void {
  sessionStorage.removeItem('meowdel_browserid');
  sessionStorage.removeItem('meowdel_browserid_full');
}
