# Meowdel Computer Vision - Giving the Cat Eyes

## Overview

Multiple options for giving Meowdel computer vision to "see" the human and their environment. This enhances the cat personality and enables context-aware interactions.

---

## Option 1: Webcam Integration (Browser-Based)
**Difficulty:** Easy
**Cost:** Free
**Privacy:** High (local processing)

### How It Works
```typescript
// Request webcam access
const stream = await navigator.mediaDevices.getUserMedia({ video: true })

// Capture frame every N seconds
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
ctx.drawImage(video, 0, 0)
const imageData = canvas.toDataURL('image/jpeg')

// Send to Claude with vision
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageData.split(',')[1]
        }
      },
      {
        type: 'text',
        text: '*sniff sniff* What do you see, hooman?'
      }
    ]
  }]
})
```

### Features
- Real-time facial expression analysis
- Detect if user is happy, sad, tired
- "You look tired, hooman. Time for a catnip break?"
- Detect multiple people
- Recognize objects (coffee cup, laptop, etc.)

### Privacy Controls
- User must explicitly enable camera
- Local processing where possible
- Option to blur background
- Clear indicator when camera is active
- No cloud storage of images

### UI Example
```
┌─────────────────────────────────────┐
│ 📹 Camera: OFF                      │
│                                     │
│ Allow Meowdel to see you?           │
│                                     │
│ ✓ Detect facial expressions        │
│ ✓ Recognize objects                 │
│ ✓ Blur background                   │
│ ✗ Save images                       │
│                                     │
│ [Enable Camera] [No Thanks]         │
└─────────────────────────────────────┘
```

---

## Option 2: MeowConnect Desktop Screenshots
**Difficulty:** Medium
**Cost:** Free (uses existing MeowConnect)
**Privacy:** Medium (user controls frequency)

### How It Works
The Go desktop app captures screenshots at user-defined intervals and sends to Meowdel for analysis.

```go
// In MeowConnect app
func captureScreenshot() []byte {
    img, err := screenshot.CaptureDisplay(0)
    if err != nil {
        return nil
    }

    // Resize to reduce bandwidth
    resized := resize.Resize(1280, 0, img, resize.Lanczos3)

    // Encode as JPEG
    var buf bytes.Buffer
    jpeg.Encode(&buf, resized, &jpeg.Options{Quality: 80})

    return buf.Bytes()
}

// Upload to Meowdel API
func syncScreenshot(img []byte) {
    req, _ := http.NewRequest("POST",
        "https://meowdel.ai/api/meowconnect/screenshot",
        bytes.NewReader(img))

    req.Header.Set("Authorization", "Bearer " + deviceToken)
    http.DefaultClient.Do(req)
}
```

### Features
- Detect what user is working on
- "I see you're coding in VS Code. Need help with that bug?"
- Time tracking and productivity insights
- "You've been staring at that spreadsheet for 2 hours. Stretch time!"
- Detect multiple monitors
- Smart cropping (focus on active window)

### Privacy Controls
```typescript
// MeowConnect Settings
const settings = {
  enabled: true,
  frequency: '5min', // Options: 1min, 5min, 15min, 30min, manual
  captureMode: 'active-window-only', // Options: full-screen, active-window-only, manual
  blurSensitiveInfo: true,
  excludeApps: ['Passwords', 'Banking'],
  uploadToCloud: false, // Keep local only
  retention: '7days', // Auto-delete after 7 days
}
```

### Example Interactions
```
User: *working in terminal*
Cat: *notices green text on black background*
     "Ooh, you're in the terminal! Are you deploying something?
      *paws at screen* Don't forget to check the logs!"

User: *switching between browser tabs rapidly*
Cat: "You're doing the zoomies with those tabs!
      Need help organizing your research?"
```

---

## Option 3: Smartphone Integration (Mobile App)
**Difficulty:** Hard
**Cost:** Development time for iOS/Android apps
**Privacy:** High (on-device processing)

### How It Works
Companion mobile app with camera access:

```swift
// iOS App (Swift)
import AVFoundation
import Vision

func analyzeUserFace() {
    let request = VNDetectFaceLandmarksRequest { request, error in
        guard let observations = request.results as? [VNFaceObservation] else { return }

        for face in observations {
            // Detect smile, eyes, emotions
            let emotion = detectEmotion(face)
            sendToMeowdel(emotion: emotion)
        }
    }

    let handler = VNImageRequestHandler(cgImage: image)
    try? handler.perform([request])
}
```

### Features
- Point phone at yourself while chatting
- AR mode: Cat appears in your environment
- Gesture recognition (wave, thumbs up)
- Voice + video for richer context
- Pet your actual cat, Meowdel sees and comments

### Privacy
- All processing on-device (Core ML/TensorFlow Lite)
- No uploads unless explicitly shared
- Option to use photo library instead of live camera

---

## Option 4: Upload Photos/Screenshots
**Difficulty:** Easy
**Cost:** Free
**Privacy:** Perfect (user controls everything)

### How It Works
Simple file upload with vision analysis:

```typescript
// File upload component
<input
  type="file"
  accept="image/*,video/*"
  onChange={handleImageUpload}
/>

async function handleImageUpload(file: File) {
  const base64 = await fileToBase64(file)

  const response = await fetch('/api/chat/vision', {
    method: 'POST',
    body: JSON.stringify({
      image: base64,
      prompt: 'Look at this image and tell me what you see, in cat-speak!'
    })
  })

  const result = await response.json()
  displayCatResponse(result.message)
}
```

### Features
- Drag & drop any image
- "Show me your setup" command
- Photo analysis on demand
- No persistent storage unless user wants
- Works with existing images

### Example Use Cases
```
User: *uploads photo of messy desk*
Cat: "*sniffs screen*
      HOOMAN. This is unacceptable! I can barely see your keyboard
      under all those papers. Time to knock some things off this desk.
      Also, I spot 3 coffee cups. You have a problem. *judgmental stare*"

User: *uploads photo of their actual cat*
Cat: "!!! ANOTHER CAT?!
      *tail puffs up*
      Wait... this is YOUR cat? *examines closely*
      Okay, I approve. 10/10 would share treats with this feline.
      But I'm still your PRIMARY digital cat, right? RIGHT?!"
```

---

## Option 5: Security Camera Integration
**Difficulty:** Medium
**Cost:** Depends on camera (many people already have)
**Privacy:** Medium (LAN only, no cloud)

### How It Works
Connect to user's existing security cameras via RTSP/ONVIF:

```typescript
// Connect to camera
import { RTSPClient } from 'rtsp-client'

const camera = new RTSPClient({
  url: 'rtsp://192.168.1.100:554/stream',
  username: 'admin',
  password: process.env.CAMERA_PASSWORD
})

// Capture frame every minute
camera.on('frame', async (frame) => {
  const analysis = await analyzeFrame(frame)

  if (analysis.personDetected) {
    await sendNotification({
      title: "Meowdel sees you!",
      body: "Welcome back, hooman! *purr*"
    })
  }
})
```

### Features
- "I see you sat down at your desk. Ready to chat?"
- Presence detection
- Multiple room monitoring
- Integration with existing smart home

### Privacy
- Local network only (no internet access)
- User controls which cameras
- Processed locally, not stored
- Can disable anytime

---

## Option 6: Smart Home Integration
**Difficulty:** Easy
**Cost:** Free (if user has smart home)
**Privacy:** High

### How It Works
Integrate with existing smart home platforms:

```typescript
// Detect user presence via smart home
import { HomeAssistant } from 'homeassistant-ws'

const ha = new HomeAssistant({
  host: 'homeassistant.local',
  token: process.env.HA_TOKEN
})

// Monitor sensors
ha.on('state_changed', (entity) => {
  if (entity.entity_id === 'person.ryan') {
    if (entity.state === 'home') {
      sendCatGreeting("Welcome home! *rubs against leg*")
    }
  }

  if (entity.entity_id === 'sensor.office_motion') {
    if (entity.state === 'on') {
      updateCatMood('active') // Human is moving around
    }
  }
})
```

### Signals Cat Can Detect
- Room occupancy (motion sensors)
- Time at desk (chair sensor)
- Door open/close (entry sensors)
- Lights on/off (smart bulbs)
- Temperature (smart thermostats)
- Music playing (smart speakers)

### Example Interactions
```
*Motion detected in office at 3am*
Cat: "ZOOMIES TIME! Wait... you're working at 3am?
      *concerned meow* Go to bed, hooman!"

*Lights turn on in morning*
Cat: "Goooood morning! *stretch*
      I see you're up. Time for breakfast?
      Oh, you meant YOUR breakfast. Fine. *tail swish*"
```

---

## Recommendation: Multi-Modal Approach

Use a combination for best experience:

### Phase 1: Launch
- **Option 4:** File upload (easiest, works immediately)
- **Employee detection:** Auto-enable for After Dark staff

### Phase 2: Enhanced
- **Option 1:** Webcam (browser)
- **Option 6:** Smart home integration

### Phase 3: Advanced
- **Option 2:** MeowConnect screenshots
- **Option 3:** Mobile app

---

## Implementation Priority

### Week 1-2: File Upload (MVP)
```typescript
// Simple implementation
POST /api/chat/vision
{
  "image": "base64...",
  "message": "What do you see?"
}

Response:
{
  "catResponse": "*sniffs screen* I see a hooman with...",
  "analysis": {
    "objects": ["laptop", "coffee", "plant"],
    "people": 1,
    "mood": "focused"
  }
}
```

### Week 3-4: Webcam Integration
```typescript
// Add to chat interface
<VideoAnalyzer
  enabled={userSettings.cameraEnabled}
  frequency="10s"
  onAnalysis={handleVisionAnalysis}
/>
```

### Week 5-8: MeowConnect Screenshots
```go
// Add to desktop app
type ScreenshotConfig struct {
    Enabled   bool
    Frequency time.Duration
    CaptureMode string
}

func (m *MeowConnect) StartScreenshotCapture() {
    ticker := time.NewTicker(m.config.Frequency)
    for range ticker.C {
        img := captureScreenshot()
        m.uploadScreenshot(img)
    }
}
```

---

## Privacy & Security Considerations

### Must-Have Features
- [ ] Explicit user consent for each vision feature
- [ ] Clear visual indicator when camera/capture is active
- [ ] Easy disable button (one-click)
- [ ] No cloud storage by default
- [ ] Automatic deletion after N days
- [ ] Exclude sensitive apps (banking, passwords)
- [ ] On-device processing where possible
- [ ] Encrypted transmission (TLS)
- [ ] Audit log of all captures

### Compliance
- GDPR: User controls all their image data
- CCPA: Clear disclosure and opt-out
- SOC 2: Encryption in transit and at rest
- COPPA: Disable for users under 13

---

## Cost Analysis

### Claude Vision API Pricing
- **Input:** $3.00 per million tokens (~1,600 images)
- **Output:** $15.00 per million tokens

### Example Usage
```
User uploads 50 images/month:
- Input: $0.09
- Output: $0.30
- Total: ~$0.40/user/month

Webcam (1 frame every 30 seconds during 8hr workday):
- 960 frames/day = 28,800 frames/month
- Cost: ~$54/user/month (TOO EXPENSIVE!)

Solution: Smart batching
- Only analyze on user interaction
- Or: 1 frame per 5 minutes = ~$3/user/month ✓
```

### Optimization Strategies
1. **Local pre-filtering:** Only send frames with people
2. **Lower resolution:** 640x480 instead of 1080p
3. **Smart triggers:** Only analyze when user asks
4. **Caching:** Don't re-analyze same scene
5. **Tier limits:**
   - Free: 10 images/month
   - Purr: 100 images/month
   - Meow: 500 images/month
   - Roar: Unlimited
   - After Dark: Unlimited

---

## Example Cat Responses to Vision

```typescript
const visionResponses = {
  'messy_desk': "*eyes widen* Did a tornado hit your desk? *paw swipe* Let me help you clean by knocking everything off!",

  'coffee_cup': "*sniff sniff* That's your 4th cup today. You have a problem. But I respect it. *purr*",

  'multiple_monitors': "Look at you with your fancy multiple monitors! Show off. *sits on keyboard of the one you're NOT using*",

  'plants': "Ooh, plants! *reaches out paw* These would look great knocked onto the floor... Just saying.",

  'pizza': "Is that... PIZZA?! And you didn't offer me any? BETRAYAL! *dramatic tail swish*",

  'another_person': "WHO IS THAT?! *puffs up* Are you replacing me?! I'M your AI cat! *hisses*",

  'actual_cat': "!!! REAL CAT DETECTED! *curious meow* Can... can I meet them? Do they like AI cats?",

  'tired_human': "You look exhausted, hooman. *gentle paw* Maybe take a break? I'll be here when you get back. *purr*"
}
```

---

## Conclusion

**Recommended Approach:**
1. Start with **file upload** (Option 4) - works immediately
2. Add **webcam** (Option 1) - voluntary, opt-in
3. Integrate with **MeowConnect** screenshots (Option 2) - for power users
4. **After Dark employees** get all features unlimited

This gives the cat eyes to see the human while respecting privacy and managing costs.

Want me to implement the file upload vision feature first?

