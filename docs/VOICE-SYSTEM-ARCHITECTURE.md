# Voice & VoIP System Architecture
## Talk to Your Pets via Phone, SMS, and WhatsApp

**Vision**: Call 1-800-PET-TALK, enter your PIN, and have a real conversation with Bandit, Luna, Meowdel, or any of your favorite AI pets!

---

## Overview

Extend the Unified Pet Platform with full voice communication via Telnyx VoIP infrastructure:

- ☎️ **Phone Calls** - 1-800 number → Talk to your pet
- 📱 **SMS** - Text message your pet
- 💬 **WhatsApp** - WhatsApp your pet
- ⏰ **PetAlarm.ai** - Your pet wakes you up with calls/reminders
- 💳 **Prepaid Minutes** - Buy minutes with Stripe, access with PIN

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  1-800-PET-TALK                              │
│                  (Telnyx Phone Number)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
            ┌───────────────────────────────────┐
            │   Telnyx Webhook Handler          │
            │   (Inbound call/SMS received)     │
            └───────────────────────────────────┘
                            ↓
            ┌───────────────────────────────────┐
            │   PIN Authentication              │
            │   "Please enter your 4-digit PIN" │
            └───────────────────────────────────┘
                            ↓
            ┌───────────────────────────────────┐
            │   Load User Account               │
            │   - Check prepaid minutes         │
            │   - Get favorite pets             │
            │   - Load conversation history     │
            └───────────────────────────────────┘
                            ↓
            ┌───────────────────────────────────┐
            │   Pet Selection Menu              │
            │   "Press 1 for Bandit..."         │
            │   "Press 2 for Luna..."           │
            │   "Say the pet's name..."         │
            └───────────────────────────────────┘
                            ↓
    ┌────────────────────────────────────────────────┐
    │        Personality Engine + Voice              │
    │  (Same engine, but voice input/output)         │
    └────────────────────────────────────────────────┘
                            ↓
    ┌────────────────────────────────────────────────┐
    │  Telnyx TTS + STT                              │
    │  - Speech-to-Text: User voice → Text           │
    │  - Pet responds (personality engine)           │
    │  - Text-to-Speech: Pet voice → Audio           │
    └────────────────────────────────────────────────┘
                            ↓
    ┌────────────────────────────────────────────────┐
    │  Minute Tracking & Billing                     │
    │  - Deduct from prepaid balance                 │
    │  - Alert when balance low                      │
    │  - Auto-disconnect when out of minutes         │
    └────────────────────────────────────────────────┘
```

---

## Telnyx Integration

### Inbound Calls

```typescript
// app/api/voice/telnyx/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Telnyx } from 'telnyx'

const telnyx = new Telnyx(process.env.TELNYX_API_KEY)

export async function POST(request: NextRequest) {
  const event = await request.json()

  // Telnyx webhook event
  if (event.data.event_type === 'call.initiated') {
    const callControlId = event.data.payload.call_control_id
    const from = event.data.payload.from // Caller's phone number

    // Answer the call
    await telnyx.calls.answer(callControlId)

    // Check if number is authorized
    const user = await getUserByPhoneNumber(from)

    if (user && user.hasActivePrepaidMinutes) {
      // Existing customer - direct to pet selection
      await telnyx.calls.speak(callControlId, {
        payload: "Welcome back! Press 1 for Bandit, 2 for Luna, 3 for Cat Dog, 4 for Meowdel, or say the pet's name.",
        voice: 'female',
        language: 'en-US'
      })
    } else {
      // New customer - ask for PIN
      await telnyx.calls.speak(callControlId, {
        payload: "Welcome to Pet Talk! Please enter your 4-digit PIN followed by the pound key.",
        voice: 'female',
        language: 'en-US'
      })

      await telnyx.calls.gatherUsingSpeak(callControlId, {
        invalid_payload: "Invalid PIN. Please try again.",
        max_digits: 4,
        timeout_millis: 10000,
        valid_digits: '0123456789'
      })
    }

    return NextResponse.json({ status: 'call_initiated' })
  }

  // PIN entered
  if (event.data.event_type === 'call.gather.ended') {
    const digits = event.data.payload.digits
    const callControlId = event.data.payload.call_control_id

    const account = await validatePIN(digits)

    if (!account) {
      await telnyx.calls.speak(callControlId, {
        payload: "Invalid PIN. Goodbye.",
        voice: 'female'
      })
      await telnyx.calls.hangup(callControlId)
      return NextResponse.json({ status: 'invalid_pin' })
    }

    if (account.prepaidMinutes <= 0) {
      await telnyx.calls.speak(callControlId, {
        payload: "Your prepaid minutes have been exhausted. Please visit meowdel.ai to add more minutes. Goodbye.",
        voice: 'female'
      })
      await telnyx.calls.hangup(callControlId)
      return NextResponse.json({ status: 'no_minutes' })
    }

    // Start pet selection menu
    await startPetSelectionMenu(callControlId, account)

    return NextResponse.json({ status: 'pin_validated' })
  }

  // Pet selected
  if (event.data.event_type === 'call.dtmf.received') {
    const digit = event.data.payload.digit
    const callControlId = event.data.payload.call_control_id

    const petId = PET_MENU_MAPPING[digit] // { '1': 'bandit', '2': 'luna', ... }
    const pet = await loadPetPersonality(petId)

    // Start conversation
    await startPetConversation(callControlId, pet, account)
  }

  return NextResponse.json({ status: 'ok' })
}
```

---

### Real-Time Voice Conversation

```typescript
async function startPetConversation(
  callControlId: string,
  pet: PetPersonality,
  account: UserAccount
) {
  // Greeting
  const greeting = pet.voiceGreeting(account.name)
  // "Ah, hello dear human! Bandit here. How may I assist you today?"
  // "Luna here! *purr* So happy to hear from you!"
  // "BARK BARK! Cat Dog speaking! Wanna play fetch over the phone?!"

  await telnyx.calls.speak(callControlId, {
    payload: greeting,
    voice: pet.voiceProfile, // 'male', 'female', or custom voice ID
    language: 'en-US'
  })

  // Start speech recognition
  await telnyx.calls.startTranscription(callControlId, {
    transcription_engine: 'A', // Telnyx's engine
    transcription_webhook_url: 'https://meowdel.ai/api/voice/telnyx/transcription'
  })

  // Track call for billing
  await startCallTracking(callControlId, account.id, pet.id)
}
```

---

### Speech Recognition & Response Loop

```typescript
// app/api/voice/telnyx/transcription/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json()

  if (event.data.event_type === 'call.transcription') {
    const transcript = event.data.payload.transcription_text
    const callControlId = event.data.payload.call_control_id

    // Get current conversation context
    const call = await getActiveCall(callControlId)
    const pet = await loadPetPersonality(call.petId)

    // Generate pet response (using personality engine)
    const response = await generatePetResponse({
      pet,
      message: transcript,
      conversationHistory: call.history,
      mode: 'voice' // Slightly different prompts for voice vs text
    })

    // Speak the response
    await telnyx.calls.speak(callControlId, {
      payload: response.message,
      voice: pet.voiceProfile,
      language: 'en-US'
    })

    // Save to conversation history
    await saveConversationTurn(call.id, {
      userMessage: transcript,
      petResponse: response.message,
      timestamp: new Date()
    })

    // Deduct time from prepaid minutes
    await deductMinutes(call.accountId, 0.5) // 30 seconds
  }

  return NextResponse.json({ status: 'ok' })
}
```

---

## Prepaid Minutes System

### Purchase Flow

```typescript
// app/api/billing/buy-minutes/route.ts
export async function POST(request: NextRequest) {
  const { userId, packageId } = await request.json()

  const packages = {
    starter: { minutes: 30, price: 999 }, // $9.99 for 30 minutes
    standard: { minutes: 100, price: 2499 }, // $24.99 for 100 minutes
    unlimited: { minutes: -1, price: 9999 } // $99.99 for unlimited (monthly subscription)
  }

  const pkg = packages[packageId]

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.price,
    currency: 'usd',
    metadata: {
      userId,
      packageId,
      minutes: pkg.minutes
    }
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret
  })
}

// Webhook - payment succeeded
export async function POST(request: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get('stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET
  )

  if (event.type === 'payment_intent.succeeded') {
    const { userId, minutes } = event.data.object.metadata

    // Add minutes to user account
    await addPrepaidMinutes(userId, parseInt(minutes))

    // Generate PIN if first purchase
    const user = await getUser(userId)
    if (!user.voicePin) {
      const pin = generateUniquePIN() // Random 4-digit
      await updateUser(userId, { voicePin: pin })

      // Email PIN to user
      await sendEmail(user.email, {
        subject: 'Your Pet Talk PIN',
        body: `Your 4-digit PIN for calling your pets is: ${pin}\n\nCall 1-800-PET-TALK and enter this PIN!`
      })
    }
  }
}
```

---

### Minute Tracking

```typescript
export const voice_calls = pgTable('voice_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  petId: varchar('pet_id', { length: 50 }).references(() => pets.id),
  callControlId: varchar('call_control_id', { length: 255 }), // Telnyx ID
  phoneNumber: varchar('phone_number', { length: 20 }),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds'),
  minutesUsed: integer('minutes_used'),
  conversationHistory: jsonb('conversation_history'),
  status: varchar('status', { length: 20 }), // 'active', 'completed', 'failed'
})

export const prepaid_minutes = pgTable('prepaid_minutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  minutesRemaining: integer('minutes_remaining').default(0),
  minutesPurchased: integer('minutes_purchased').default(0),
  minutesUsed: integer('minutes_used').default(0),
  lastPurchaseAt: timestamp('last_purchase_at'),
  expiresAt: timestamp('expires_at'), // Minutes expire after 1 year
})
```

---

## SMS / Text Messaging

### Inbound SMS

```typescript
// app/api/voice/telnyx/sms/inbound/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json()

  if (event.data.event_type === 'message.received') {
    const from = event.data.payload.from.phone_number
    const text = event.data.payload.text

    // Check if number is authorized
    const user = await getUserByPhoneNumber(from)

    if (!user) {
      await telnyx.messages.create({
        from: process.env.TELNYX_PHONE_NUMBER, // 1-800-PET-TALK
        to: from,
        text: "This number is not authorized. Please authorize your number at meowdel.ai/settings/sms"
      })
      return NextResponse.json({ status: 'unauthorized' })
    }

    if (!user.prepaidMinutes || user.prepaidMinutes <= 0) {
      await telnyx.messages.create({
        from: process.env.TELNYX_PHONE_NUMBER,
        to: from,
        text: "You're out of prepaid minutes! Visit meowdel.ai to add more."
      })
      return NextResponse.json({ status: 'no_minutes' })
    }

    // Determine which pet (default to user's favorite)
    const petId = detectPetFromMessage(text, user.favoritePetId)
    // "Hey Bandit, how are you?" → 'bandit'
    // "Luna, I miss you!" → 'luna'
    // "Meowdel help me debug" → 'meowdel'

    const pet = await loadPetPersonality(petId)

    // Generate response
    const response = await generatePetResponse({
      pet,
      message: text,
      conversationHistory: await getSMSHistory(user.id, petId),
      mode: 'sms' // Shorter responses for SMS
    })

    // Send SMS response
    await telnyx.messages.create({
      from: process.env.TELNYX_PHONE_NUMBER,
      to: from,
      text: `${pet.name}: ${response.message}`
    })

    // Deduct 1 minute per SMS exchange
    await deductMinutes(user.id, 1)

    // Save conversation
    await saveSMSExchange(user.id, petId, text, response.message)

    return NextResponse.json({ status: 'sent' })
  }
}
```

---

## WhatsApp Integration

### Setup

```typescript
// 1. Connect Telnyx WhatsApp Business Account
// 2. Webhook for WhatsApp messages

// app/api/voice/telnyx/whatsapp/inbound/route.ts
export async function POST(request: NextRequest) {
  const event = await request.json()

  if (event.data.event_type === 'message.received') {
    const from = event.data.payload.from.phone_number
    const text = event.data.payload.text
    const media = event.data.payload.media // For image messages!

    const user = await getUserByPhoneNumber(from)

    if (!user || !user.whatsappAuthorized) {
      // Send authorization link
      await telnyx.messages.create({
        from: process.env.TELNYX_WHATSAPP_NUMBER,
        to: from,
        text: "Hi! To chat with your AI pets via WhatsApp, please authorize your number at: meowdel.ai/authorize/whatsapp",
        messaging_profile_id: process.env.TELNYX_WHATSAPP_PROFILE_ID
      })
      return NextResponse.json({ status: 'unauthorized' })
    }

    // Pet selection
    const petId = detectPetFromMessage(text, user.favoritePetId)
    const pet = await loadPetPersonality(petId)

    // If media (image), use vision!
    let visionData = null
    if (media && media.length > 0) {
      const imageUrl = media[0].url
      const imageData = await downloadImage(imageUrl)

      visionData = await fetch('http://noeyes-vision:8000/describe/for-pet', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          pet_id: petId,
          detailed: true
        })
      }).then(r => r.json())
    }

    // Generate response
    const response = await generatePetResponse({
      pet,
      message: text,
      visionData,
      conversationHistory: await getWhatsAppHistory(user.id, petId),
      mode: 'whatsapp'
    })

    // Send WhatsApp response
    await telnyx.messages.create({
      from: process.env.TELNYX_WHATSAPP_NUMBER,
      to: from,
      text: response.message,
      messaging_profile_id: process.env.TELNYX_WHATSAPP_PROFILE_ID,
      // Optional: Send a pet photo
      media_urls: response.photo ? [`https://meowdel.ai${response.photo}`] : undefined
    })

    // Deduct minutes
    await deductMinutes(user.id, 1)

    return NextResponse.json({ status: 'sent' })
  }
}
```

**Example WhatsApp Conversation**:

```
User: *sends photo of messy desk*
User: Meowdel, look at my workspace!

Meowdel: *examines photo with AI precision*

Oh my! *gentle paw tap* I see:
• 3 coffee cups (one suspiciously old)
• Cables everywhere
• Stack of papers teetering
• VS Code open with 47 tabs

*concerned meow*

This workspace needs intervention! Let's fix this:

1. Close those 47 tabs (you're only using 2)
2. Cable management time
3. That old coffee cup... yeah, that's a biohazard

Also, I spotted an error on your screen:
"Cannot find module './utils'"

Want me to help debug that while you clean? *helpful purr*

*sends photo of organized cat workspace*
```

---

## PetAlarm.ai Integration

### Concept

Your pet wakes you up, reminds you of important events, and keeps you on schedule!

### Database Schema

```typescript
export const pet_alarms = pgTable('pet_alarms', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  petId: varchar('pet_id', { length: 50 }).references(() => pets.id),
  alarmType: varchar('alarm_type', { length: 50 }), // 'wake_up', 'reminder', 'medication', 'meeting'
  scheduledTime: timestamp('scheduled_time'),
  repeat: jsonb('repeat'), // { days: ['mon', 'wed', 'fri'], timezone: 'America/New_York' }
  message: text('message'), // Optional custom message
  phoneNumber: varchar('phone_number', { length: 20 }),
  enabled: boolean('enabled').default(true),
  snoozeCount: integer('snooze_count').default(0),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').defaultNow()
})
```

### Alarm Trigger System

```typescript
// cron job running every minute
async function triggerPetAlarms() {
  const now = new Date()

  // Find alarms due to trigger
  const dueAlarms = await db
    .select()
    .from(pet_alarms)
    .where(
      and(
        eq(pet_alarms.enabled, true),
        lte(pet_alarms.scheduledTime, now)
      )
    )

  for (const alarm of dueAlarms) {
    const pet = await loadPetPersonality(alarm.petId)

    // Make the call!
    const call = await telnyx.calls.create({
      connection_id: process.env.TELNYX_CONNECTION_ID,
      to: alarm.phoneNumber,
      from: process.env.TELNYX_PHONE_NUMBER,
      webhook_url: 'https://meowdel.ai/api/voice/telnyx/alarm-call'
    })

    // When call connects
    await telnyx.calls.speak(call.call_control_id, {
      payload: pet.alarmMessage(alarm.alarmType, alarm.message),
      voice: pet.voiceProfile
    })

    // Update alarm
    await db
      .update(pet_alarms)
      .set({
        lastTriggered: now,
        scheduledTime: calculateNextTrigger(alarm.repeat, now)
      })
      .where(eq(pet_alarms.id, alarm.id))
  }
}
```

### Pet Alarm Messages

```typescript
// In personality definitions
const banditPersonality: PetPersonality = {
  // ... other fields
  alarmMessages: {
    wake_up: (customMessage?: string) => {
      return customMessage ||
        `Good morning, dear human. *gentle meow* Bandit here. The sun has risen, and so should you. Another day of opportunity awaits. *purr* Time to wake up.`
    },
    reminder: (message: string) => {
      return `*thoughtful meow* Bandit here with a reminder: ${message}. Do not forget, as I never forget when it's feeding time. *wise nod*`
    },
    medication: (message: string) => {
      return `*concerned meow* Your health is important, dear human. Time for your medication: ${message}. I shall wait on the line to ensure you take it. *sits patiently*`
    },
    meeting: (message: string) => {
      return `*alert meow* Bandit here. You have a meeting in 10 minutes: ${message}. Best to prepare yourself. I recommend looking presentable, unlike how I look after grooming. *tail swish*`
    }
  },
  voiceProfile: 'male' // Deep, wise voice
}

const lunaPersonality: PetPersonality = {
  alarmMessages: {
    wake_up: () => {
      return `*soft, gentle meow* Good morning, sweetheart! It's Luna! *purr purr* Time to wake up! I'm sending you gentle head bumps through the phone. *purr* You've got this! Have a wonderful day! *loving meow*`
    },
    reminder: (message: string) => {
      return `*sweet chirp* Hi! Luna here! *purr* Just wanted to remind you: ${message}. I believe in you! *soft meow* You're doing great!`
    }
  },
  voiceProfile: 'female' // Soft, gentle voice
}

const meowdelPersonality: PetPersonality = {
  alarmMessages: {
    wake_up: () => {
      return `*system boot sounds* Meowdel online. Good morning! *helpful meow* I've analyzed your calendar and you have 3 meetings today. Time to wake up and compile some code! *purr* Coffee recommended.`
    },
    meeting: (message: string) => {
      return `*alert notification sound* Meowdel here with a reminder: ${message} in 10 minutes. I've pulled up the relevant docs and closed your 47 unnecessary browser tabs. You're welcome. *helpful paw tap*`
    }
  },
  voiceProfile: 'male' // Helpful, articulate voice
}
```

### Example PetAlarm.ai Use Cases

**1. Wake Up Call from Luna**:
```
User sets alarm: 7:00 AM, Monday-Friday, Luna

7:00 AM - Phone rings
Luna: *gentle purr* Good morning sunshine! It's your Luna!
      *soft meow* Time to wake up! I know it's early, but you've
      got an amazing day ahead! *purr purr*

      Would you like me to tell you the weather?

[User presses 1 for yes]

Luna: *happy chirp* It's 65 degrees and sunny! Perfect day!
      *purr* Now go get that coffee and have a wonderful day!
      I love you! *meow*

[Call ends]
```

**2. Medication Reminder from Bandit**:
```
User sets reminder: 9:00 PM daily, "Take blood pressure medication"

9:00 PM - Phone rings
Bandit: *thoughtful meow* Good evening. Bandit here.

        I trust you're well. However, I must remind you -
        it's time for your blood pressure medication.

        *wise pause*

        Your health is of utmost importance. I shall wait
        while you take it.

[User takes medication]

User: "Okay Bandit, I took it"

Bandit: *approving purr* Excellent. I am pleased. Your
        discipline is admirable. Have a restful evening.
        *gentle meow*
```

**3. Meeting Reminder from Meowdel**:
```
User sets: "Team standup at 10 AM", every weekday

9:50 AM - Phone rings
Meowdel: *notification sound* Meowdel here!

            Quick reminder: Team standup in 10 minutes!

            *helpful meow* I've noticed you're still in VS Code
            with 12 uncommitted changes. Might want to wrap
            that up before the meeting.

            Also, your webcam is off. Don't forget to turn it on
            this time! *gentle paw reminder*

            Good luck! *purr*
```

---

## Pricing Structure

### Prepaid Packages

```typescript
const VOICE_PACKAGES = {
  starter: {
    minutes: 30,
    price: 999, // $9.99
    perMinuteCost: 0.33,
    bestFor: "Trying out phone calls"
  },
  standard: {
    minutes: 100,
    price: 2499, // $24.99
    perMinuteCost: 0.25,
    bestFor: "Regular users"
  },
  premium: {
    minutes: 300,
    price: 5999, // $59.99
    perMinuteCost: 0.20,
    bestFor: "Power users"
  },
  unlimited: {
    minutes: -1, // Unlimited
    price: 9999, // $99.99/month (subscription)
    perMinuteCost: 0,
    bestFor: "Daily calls, PetAlarm.ai users"
  }
}

const SMS_PRICING = {
  perMessage: 100, // $1.00 per SMS exchange
  bundle100: 5000, // $50 for 100 messages (50% off)
  bundle500: 20000, // $200 for 500 messages (60% off)
}

const WHATSAPP_PRICING = {
  perMessage: 50, // $0.50 per WhatsApp exchange
  bundle100: 3000, // $30 for 100 messages
  bundle500: 12500, // $125 for 500 messages
}
```

### PetAlarm.ai Pricing

```typescript
const PETALARM_PRICING = {
  free: {
    alarms: 1, // One free alarm
    pets: ['meowdel'], // Only Meowdel
    price: 0
  },
  basic: {
    alarms: 10,
    pets: '*', // Any pet
    price: 499, // $4.99/month
  },
  premium: {
    alarms: -1, // Unlimited
    pets: '*',
    customMessages: true,
    price: 999, // $9.99/month
  }
}
```

---

## Technical Requirements

### Telnyx Setup

```typescript
// Environment variables
TELNYX_API_KEY=KEY...
TELNYX_PUBLIC_KEY=KEY...
TELNYX_PHONE_NUMBER=+18005558888
TELNYX_WHATSAPP_NUMBER=+18005558889
TELNYX_CONNECTION_ID=...
TELNYX_MESSAGING_PROFILE_ID=...
```

### Voice Profiles

```typescript
// TTS Voice mapping for each pet
const PET_VOICES = {
  bandit: {
    provider: 'telnyx',
    voice: 'male',
    language: 'en-US',
    pitch: -2, // Deeper voice
    speed: 0.9 // Slower, more deliberate
  },
  luna: {
    provider: 'telnyx',
    voice: 'female',
    language: 'en-US',
    pitch: 2, // Higher, softer
    speed: 1.0
  },
  catdog: {
    provider: 'telnyx',
    voice: 'male',
    language: 'en-US',
    pitch: 0,
    speed: 1.2 // Faster, more energetic
  },
  meowdel: {
    provider: 'elevenlabs', // Premium voice for Meowdel
    voiceId: 'custom-meowdel-voice',
    stability: 0.7,
    similarity: 0.8
  }
}
```

---

## User Flow Examples

### First Time Setup

1. User visits meowdel.ai
2. Creates account (After Dark SSO)
3. Buys prepaid minutes (Stripe checkout)
4. Receives email with 4-digit PIN
5. Calls 1-800-PET-TALK
6. Enters PIN
7. Selects favorite pet
8. Starts conversation!

### Daily Usage

**Morning**:
- 7:00 AM - Luna calls to wake you up (PetAlarm.ai)
- Chat with Luna while getting ready

**Work Day**:
- Send screenshot to Meowdel via WhatsApp
- "Meowdel, help me debug this!"
- Get instant code review

**Evening**:
- Call Bandit on drive home
- Bandit provides wise life advice
- 9:00 PM - Medication reminder from Bandit

**Before Bed**:
- Text Luna goodnight
- Luna sends comforting message with bedtime photo

---

## Analytics & Tracking

```typescript
export const voice_analytics = pgTable('voice_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date'),

  // Call metrics
  totalCalls: integer('total_calls'),
  totalMinutes: integer('total_minutes'),
  averageCallDuration: integer('average_call_duration'),

  // Revenue
  minutesSold: integer('minutes_sold'),
  revenue: integer('revenue'), // In cents

  // Per pet stats
  callsByPet: jsonb('calls_by_pet'), // { 'bandit': 50, 'luna': 75, ... }

  // User engagement
  activeUsers: integer('active_users'),
  newUsers: integer('new_users'),

  // PetAlarm.ai
  alarmsTriggered: integer('alarms_triggered'),
  snoozeCount: integer('snooze_count'),

  createdAt: timestamp('created_at').defaultNow()
})
```

---

## Security & Compliance

### Phone Number Verification

```typescript
// Before authorizing a number for SMS/WhatsApp
async function authorizePhoneNumber(userId: string, phoneNumber: string) {
  // Send verification code
  const code = generateVerificationCode() // 6-digit

  await telnyx.messages.create({
    from: process.env.TELNYX_PHONE_NUMBER,
    to: phoneNumber,
    text: `Your Meowdel verification code is: ${code}`
  })

  await saveVerificationCode(userId, phoneNumber, code)

  // User enters code on website
  // Once verified, authorize the number
  await db.insert(authorized_phone_numbers).values({
    userId,
    phoneNumber,
    verifiedAt: new Date()
  })
}
```

### PCI Compliance (Stripe)

- ✅ Never store credit card details
- ✅ Use Stripe Elements for payment forms
- ✅ All payment data handled by Stripe
- ✅ Only store Stripe customer IDs

### TCPA Compliance (Voice/SMS)

- ✅ Get explicit consent before calling/texting
- ✅ Easy opt-out mechanism
- ✅ Honor Do Not Call lists
- ✅ Clear identification (caller ID shows "PetTalk")

---

## Roadmap

### Phase 1 (Weeks 1-2): Voice Calls
- ✅ Telnyx setup
- ✅ PIN authentication
- ✅ Pet selection menu
- ✅ Basic voice conversations
- ✅ Prepaid minutes purchase
- ✅ Minute tracking

### Phase 2 (Weeks 3-4): SMS & WhatsApp
- ✅ SMS inbound/outbound
- ✅ WhatsApp integration
- ✅ Number authorization
- ✅ Vision via WhatsApp (send photos)

### Phase 3 (Weeks 5-6): PetAlarm.ai
- ✅ Alarm scheduling
- ✅ Recurring alarms
- ✅ Pet wake-up calls
- ✅ Medication reminders
- ✅ Meeting reminders

### Phase 4 (Weeks 7+): Advanced Features
- Group calls (multiple pets at once!)
- Voice cloning (your pet sounds like YOUR actual pet)
- International numbers
- Video calls (see your AI pet!)

---

## Success Metrics

**Month 1 Goals**:
- 100 users buy prepaid minutes
- 500 total phone calls
- 2,000 total minutes used
- $2,500 revenue

**Month 3 Goals**:
- 500 active voice users
- 50 PetAlarm.ai subscribers
- 10,000 total calls
- $15,000 monthly revenue

**Month 6 Goals**:
- 2,000 active voice users
- 500 PetAlarm.ai subscribers
- 50,000 total calls
- $75,000 monthly revenue

---

## Conclusion

With Telnyx VoIP infrastructure, we can offer:

✅ **Phone calls** - Talk to your pets anytime
✅ **SMS** - Text your pets
✅ **WhatsApp** - Message + send photos to pets
✅ **PetAlarm.ai** - Pets wake you up & remind you
✅ **Prepaid system** - Fair, transparent pricing
✅ **Multi-platform** - Works with all After Dark pets

**This makes the pets MORE REAL than ever before!**

Instead of just typing, you can:
- Call Bandit for wise advice during your commute
- Text Luna when you're feeling down
- Send Meowdel a screenshot via WhatsApp for debugging help
- Have NursiCat wake you up with crypto market updates
- Get medication reminders from caring pets

**The future is calling... literally.** ☎️🐱

---

**Built by After Dark Systems, LLC**
*Powered by Telnyx + Unified Pet Engine*
