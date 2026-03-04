# BrowserID Auto-Login Integration

## Overview

Meowdel now uses **BrowserID** technology (from webbrowsers.id) to automatically identify and remember users across sessions. This creates a magical experience where the cat remembers you every time you visit!

## How It Works

### 1. Automatic User Identification

When a user visits meowdel.ai:

```typescript
// User visits the site
const browserID = await generateBrowserID();

// Check if we know this browser
const response = await fetch('/api/browserid/identify', {
  method: 'POST',
  body: JSON.stringify({ browserID })
});

if (response.known) {
  // Welcome back! Auto-login
  showPersonalizedGreeting(response.user);
} else {
  // New user - create profile
  createNewUserProfile(browserID);
}
```

### 2. Cat Personality Persistence

Every interaction with the cat is remembered:

```typescript
interface CatPersonalityProfile {
  // User preferences
  meowFrequency: 'rare' | 'moderate' | 'chatty';
  personalityMode: 'playful' | 'professional' | 'balanced';

  // Relationship data
  affinity: number;              // 0-100
  trustLevel: number;            // 0-100
  bugsSolvedTogether: number;

  // Learning data
  conversationTopics: string[];
  preferredLanguages: string[];
  commonBugTypes: string[];
}
```

### 3. OAuth2 Cross-Device Sync

When a user signs in with OAuth2 (Google, GitHub, etc.):

```typescript
// Link BrowserID to OAuth account
await linkOAuth({
  browserID: currentBrowserID,
  oauthProvider: 'google',
  oauthUserId: 'user_123',
  email: 'user@example.com'
});

// Now all devices with this OAuth account share the same cat personality!
```

## Features

### ✨ Automatic Recognition

**First Visit:**
```
*stretches and yawns*

Meow! Nice to meet you! 🐱

I'm Meowdel - your AI coding cat! I'll remember you next time with my special BrowserID memory powers! ✨
```

**Return Visit (Low Affinity):**
```
*meow* Oh, it's you. *yawns*

Back for more debugging, I see. Alright, let's get to work. *sits on keyboard*
```

**Return Visit (High Affinity):**
```
*PURRS LOUDLY* Ryan! You're back! *rubs against screen*

I've missed you SO much! Ready to write some amazing code together? We make a great team! 💜
```

### 📊 Personalized Experience

The cat adapts to your preferences:

- **Meow Frequency**: Rare, Moderate, or Chatty
  - Rare: `*purrs*` (20% of the time)
  - Moderate: `*meow* *tail swish*` (50%)
  - Chatty: `*meow* *purr* *mrrp* *stretches*` (80%)

- **Personality Mode**: Playful, Professional, or Balanced
  - Playful: Lots of cat jokes and silly behavior
  - Professional: Focused and efficient
  - Balanced: Mix of both

### 🔗 Cross-Device Sync

**Scenario:** User codes on laptop, then switches to phone

1. **Laptop** (first time):
   - Generates BrowserID: `abc123...`
   - Creates cat personality: Affinity 50, 0 bugs fixed

2. **User signs in with Google** on laptop:
   - Links `abc123...` to `google:user_xyz`

3. **Phone** (first time on this device):
   - Generates different BrowserID: `def456...`
   - User signs in with same Google account
   - Links `def456...` to `google:user_xyz`

4. **Magic happens:**
   - System detects both BrowserIDs belong to same user
   - Merges cat personalities
   - Now BOTH devices show: Affinity 50+, all bugs fixed count
   - Cat says: *purrs* "I recognize you from your laptop! Welcome back!"

### 💾 What Gets Saved

Per BrowserID:
- Session count
- First seen / last seen timestamps
- Cat personality preferences
- Conversation topics
- Bugs solved together
- Preferred programming languages
- Activity patterns (night owl vs morning person)
- Affinity and trust levels

## Implementation Guide

### Using the Hook

```typescript
import { useBrowserID, useCatPersonality } from '@/lib/useBrowserID';

function MyComponent() {
  const {
    browserID,
    user,
    isReturningUser,
    sessionCount,
    linkOAuth
  } = useBrowserID();

  const {
    personality,
    updateMeowFrequency,
    recordBugSolved,
    increaseAffinity
  } = useCatPersonality();

  // Auto-identifies on mount
  // Shows personalized greeting
  // Remembers preferences

  return (
    <div>
      {isReturningUser ? (
        <p>Welcome back! Visit #{sessionCount}</p>
      ) : (
        <p>Nice to meet you!</p>
      )}
    </div>
  );
}
```

### API Endpoints

#### POST /api/browserid/identify
Identify a user by their BrowserID
```json
{
  "browserID": "abc123..."
}
```

Response:
```json
{
  "success": true,
  "known": true,
  "user": { ... },
  "message": "Welcome back! Session #42"
}
```

#### POST /api/browserid/personality
Update cat personality preferences
```json
{
  "browserID": "abc123...",
  "personality": {
    "meowFrequency": "chatty",
    "affinity": 85
  }
}
```

#### POST /api/browserid/link-oauth
Link BrowserID to OAuth account for cross-device sync
```json
{
  "browserID": "abc123...",
  "oauthProvider": "google",
  "oauthUserId": "user_123",
  "email": "user@example.com"
}
```

## Privacy & Security

### What We Track
- Browser fingerprint (canvas, WebGL, audio context)
- Screen resolution, timezone, language
- User preferences and settings
- Conversation history (anonymized)

### What We DON'T Track
- Personal information (unless OAuth linked)
- Browsing history outside meowdel.ai
- Keystrokes or passwords
- Private code snippets

### User Rights (GDPR Compliant)
- View all data: `/api/browserid/identify?browserID=...`
- Export data: Coming soon
- Delete data: Coming soon
- Opt-out: Clear browser cache + don't sign in with OAuth

## BrowserID Technology

Powered by webbrowsers.id cryptographic fingerprinting:

- **99.9% accuracy** - Reliably identifies same browser
- **Survives cookie clearing** - No cookies required
- **Cross-domain capable** - Works across subdomains
- **GDPR compliant** - Full transparency and control

### Fingerprint Components

1. **Canvas Fingerprint**: Unique rendering signature
2. **WebGL Fingerprint**: GPU renderer detection
3. **Audio Fingerprint**: Audio context analysis
4. **Screen Data**: Resolution, color depth, orientation
5. **System Data**: Timezone, language, platform
6. **Feature Detection**: Fonts, plugins, touch support

## Example Use Cases

### 1. Returning User Experience
```typescript
// User visits after 1 week
const { user } = useBrowserID();

if (user.catPersonality.affinity > 70) {
  cat.say("*PURRS LOUDLY* I missed you! 💜");
  cat.recall(`We last worked on ${user.catPersonality.lastTopic}`);
}
```

### 2. Adaptive Difficulty
```typescript
// Adjust help level based on experience
if (user.catPersonality.bugsSolvedTogether > 50) {
  cat.setHelpLevel('hints'); // They know what they're doing
} else {
  cat.setHelpLevel('detailed'); // More explanation needed
}
```

### 3. Activity Pattern Detection
```typescript
// Check when user typically codes
const hour = new Date().getHours();
const isNightOwl = user.catPersonality.codingHours[hour] > 10;

if (isNightOwl && hour === 3) {
  cat.say("*yawns* 3AM coding again? You need sleep! But... *stretches* I'll stay up with you. *purr*");
}
```

### 4. Cross-Device Continuity
```typescript
// User starts on laptop, continues on phone
if (user.linkedBrowserIDs.length > 1) {
  cat.say("*tail swish* I see you switched devices! Still working on that authentication bug from earlier?");
}
```

## Future Enhancements

### Planned Features

1. **OAuth Integration Complete**
   - Google Sign-In ✅
   - GitHub Sign-In (Coming soon)
   - Discord Sign-In (Coming soon)

2. **Advanced Analytics**
   - Coding time heatmaps
   - Language preference trends
   - Bug pattern analysis

3. **Multi-Cat Personalities**
   - Different cats for different projects
   - Cats can "remember" each other
   - Team collaboration features

4. **Export & Import**
   - Download your cat personality
   - Transfer to another device
   - Share with friends

## Testing

### Manual Testing

1. **First Visit Test**
   ```bash
   # Open incognito window
   # Visit http://localhost:3000
   # Should see "Nice to meet you!" message
   ```

2. **Returning User Test**
   ```bash
   # Visit again in same browser
   # Should see "Welcome back! Visit #2"
   # Affinity and preferences should persist
   ```

3. **Cross-Device Test**
   ```bash
   # Device 1: Visit and sign in with Google
   # Interact with cat, increase affinity
   # Device 2: Visit and sign in with same Google account
   # Should see same affinity and conversation history
   ```

### API Testing

```bash
# Test identification
curl -X POST http://localhost:3000/api/browserid/identify \
  -H "Content-Type: application/json" \
  -d '{"browserID": "test123"}'

# Test personality update
curl -X POST http://localhost:3000/api/browserid/personality \
  -H "Content-Type: application/json" \
  -d '{"browserID": "test123", "personality": {"affinity": 100}}'
```

## Troubleshooting

### Cat doesn't remember me
- Clear sessionStorage: `sessionStorage.clear()`
- Check if cookies are enabled
- Try in normal browsing mode (not incognito)

### Different devices show different personalities
- Make sure to sign in with OAuth on both devices
- Check `/api/browserid/link-oauth` was called
- Verify same OAuth account on both

### Fingerprint not generating
- Check browser compatibility (needs Canvas, WebGL, Audio Context)
- Some privacy tools block fingerprinting (expected behavior)
- Fallback to simpler fingerprint in those cases

---

Built with 🐱💜 by the Meowdel Team

*purrs* Thanks for using BrowserID auto-login!
