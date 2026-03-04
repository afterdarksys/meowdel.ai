/**
 * Updated Stripe Product Setup Script
 * Creates all subscription products and add-ons for Meowdel
 * New pricing: Free, Purr $9, Meow $25, Biscuits $55, Swat $75, Roar $100
 * Plus 4 add-on packs
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

async function setupStripeProducts() {
  console.log('🚀 Setting up NEW Meowdel pricing structure...\n')

  try {
    // Base Tiers
    console.log('=== CREATING BASE TIERS ===\n')

    // Tier 1: Purr ($9/month)
    console.log('Creating Purr tier ($9)...')
    const purrProduct = await stripe.products.create({
      name: 'Meowdel Purr',
      description: '1,000 messages/month, 3 minutes voice/day, 1 daily text',
      metadata: {
        tier: 'purr',
        messages_limit: '1000',
        voice_minutes_daily: '3',
        daily_texts: '1',
        features: 'all_personalities,voice_chat,daily_texts,priority_responses,email_support',
      },
    })

    const purrPrice = await stripe.prices.create({
      product: purrProduct.id,
      unit_amount: 900, // $9.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'purr' },
    })

    console.log(`✅ Purr: ${purrPrice.id}\n`)

    // Tier 2: Meow ($25/month)
    console.log('Creating Meow tier ($25)...')
    const meowProduct = await stripe.products.create({
      name: 'Meowdel Meow',
      description: '5,000 messages/month, 7 minutes voice/day, 3 daily texts, wake-ups & reminders',
      metadata: {
        tier: 'meow',
        messages_limit: '5000',
        voice_minutes_daily: '7',
        daily_texts: '3',
        wakeup_calls_daily: '1',
        reminders_daily: '2',
        features: 'all_purr,vision_upload,wakeup_calls,reminders,api_access',
      },
    })

    const meowPrice = await stripe.prices.create({
      product: meowProduct.id,
      unit_amount: 2500, // $25.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'meow' },
    })

    console.log(`✅ Meow: ${meowPrice.id}\n`)

    // Tier 3: Biscuits ($55/month)
    console.log('Creating Biscuits tier ($55)...')
    const biscuitsProduct = await stripe.products.create({
      name: 'Meowdel Biscuits',
      description: '15,000 messages/month, 15 minutes voice/day, 5 daily texts, WhatsApp',
      metadata: {
        tier: 'biscuits',
        messages_limit: '15000',
        voice_minutes_daily: '15',
        daily_texts: '5',
        wakeup_calls_daily: '2',
        reminders_daily: '5',
        features: 'all_meow,whatsapp,priority_support',
      },
    })

    const biscuitsPrice = await stripe.prices.create({
      product: biscuitsProduct.id,
      unit_amount: 5500, // $55.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'biscuits' },
    })

    console.log(`✅ Biscuits: ${biscuitsPrice.id}\n`)

    // Tier 4: Swat ($75/month)
    console.log('Creating Swat tier ($75)...')
    const swatProduct = await stripe.products.create({
      name: 'Meowdel Swat',
      description: '30,000 messages/month, 30 minutes voice/day, 10 daily texts, SMS access',
      metadata: {
        tier: 'swat',
        messages_limit: '30000',
        voice_minutes_daily: '30',
        daily_texts: '10',
        wakeup_calls_daily: '3',
        reminders_daily: '10',
        features: 'all_biscuits,sms_access,advanced_api',
      },
    })

    const swatPrice = await stripe.prices.create({
      product: swatProduct.id,
      unit_amount: 7500, // $75.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'swat' },
    })

    console.log(`✅ Swat: ${swatPrice.id}\n`)

    // Tier 5: Roar ($100/month)
    console.log('Creating Roar tier ($100)...')
    const roarProduct = await stripe.products.create({
      name: 'Meowdel Roar',
      description: 'Unlimited everything! Messages, voice, texts, wake-ups, reminders, phone access',
      metadata: {
        tier: 'roar',
        messages_limit: 'unlimited',
        voice_minutes_daily: 'unlimited',
        daily_texts: 'unlimited',
        wakeup_calls_daily: 'unlimited',
        reminders_daily: 'unlimited',
        features: 'all_swat,unlimited,phone_access,white_label,dedicated_support',
      },
    })

    const roarPrice = await stripe.prices.create({
      product: roarProduct.id,
      unit_amount: 10000, // $100.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'roar' },
    })

    console.log(`✅ Roar: ${roarPrice.id}\n`)

    // Add-On Packs
    console.log('\n=== CREATING ADD-ON PACKS ===\n')

    // Add-On 1: Extra Voice Time ($10/month)
    console.log('Creating Extra Voice Time add-on ($10)...')
    const voiceAddonProduct = await stripe.products.create({
      name: 'Extra Voice Time',
      description: '+30 minutes voice chat/day with rollover',
      metadata: {
        addon_type: 'voice',
        voice_minutes_daily: '30',
        rollover: 'true',
      },
    })

    const voiceAddonPrice = await stripe.prices.create({
      product: voiceAddonProduct.id,
      unit_amount: 1000, // $10.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { addon: 'voice' },
    })

    console.log(`✅ Extra Voice: ${voiceAddonPrice.id}\n`)

    // Add-On 2: Wake-Up Pack ($5/month)
    console.log('Creating Wake-Up Pack add-on ($5)...')
    const wakeupAddonProduct = await stripe.products.create({
      name: 'Wake-Up Pack',
      description: '+5 wake-up calls/day with custom messages',
      metadata: {
        addon_type: 'wakeup',
        wakeup_calls_daily: '5',
        custom_messages: 'true',
      },
    })

    const wakeupAddonPrice = await stripe.prices.create({
      product: wakeupAddonProduct.id,
      unit_amount: 500, // $5.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { addon: 'wakeup' },
    })

    console.log(`✅ Wake-Up Pack: ${wakeupAddonPrice.id}\n`)

    // Add-On 3: Daily Check-Ins ($8/month)
    console.log('Creating Daily Check-Ins add-on ($8)...')
    const textsAddonProduct = await stripe.products.create({
      name: 'Daily Check-Ins',
      description: '+10 daily texts with scheduled check-ins',
      metadata: {
        addon_type: 'texts',
        daily_texts: '10',
        scheduled: 'true',
      },
    })

    const textsAddonPrice = await stripe.prices.create({
      product: textsAddonProduct.id,
      unit_amount: 800, // $8.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { addon: 'texts' },
    })

    console.log(`✅ Daily Check-Ins: ${textsAddonPrice.id}\n`)

    // Add-On 4: Reminder Pro ($7/month)
    console.log('Creating Reminder Pro add-on ($7)...')
    const remindersAddonProduct = await stripe.products.create({
      name: 'Reminder Pro',
      description: '+10 reminders/day with smart scheduling',
      metadata: {
        addon_type: 'reminders',
        reminders_daily: '10',
        smart_scheduling: 'true',
      },
    })

    const remindersAddonPrice = await stripe.prices.create({
      product: remindersAddonProduct.id,
      unit_amount: 700, // $7.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { addon: 'reminders' },
    })

    console.log(`✅ Reminder Pro: ${remindersAddonPrice.id}\n`)

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ ALL PRODUCTS CREATED SUCCESSFULLY!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📋 BASE TIERS - Add to .env:\n')
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_PURR=${purrPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MEOW=${meowPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_BISCUITS=${biscuitsPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_SWAT=${swatPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ROAR=${roarPrice.id}`)

    console.log('\n📦 ADD-ON PACKS - Add to .env:\n')
    console.log(`NEXT_PUBLIC_STRIPE_ADDON_VOICE=${voiceAddonPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_ADDON_WAKEUP=${wakeupAddonPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_ADDON_TEXTS=${textsAddonPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_ADDON_REMINDERS=${remindersAddonPrice.id}`)

    console.log('\n💰 REVENUE POTENTIAL:\n')
    console.log('Base Tiers:')
    console.log('  Purr:     $9/mo   × 100 users = $900/mo')
    console.log('  Meow:     $25/mo  × 100 users = $2,500/mo')
    console.log('  Biscuits: $55/mo  × 50 users  = $2,750/mo')
    console.log('  Swat:     $75/mo  × 25 users  = $1,875/mo')
    console.log('  Roar:     $100/mo × 10 users  = $1,000/mo')
    console.log('  Subtotal:                       $9,025/mo')
    console.log('\nAdd-Ons (avg 2 per paid user):')
    console.log('  Voice:    $10/mo  × 100 users = $1,000/mo')
    console.log('  Wake-up:  $5/mo   × 75 users  = $375/mo')
    console.log('  Texts:    $8/mo   × 60 users  = $480/mo')
    console.log('  Reminders:$7/mo   × 50 users  = $350/mo')
    console.log('  Subtotal:                       $2,205/mo')
    console.log('\n  TOTAL POTENTIAL: $11,230/month')
    console.log('  ANNUAL:          $134,760/year\n')

    return {
      tiers: {
        purr: { product: purrProduct.id, price: purrPrice.id },
        meow: { product: meowProduct.id, price: meowPrice.id },
        biscuits: { product: biscuitsProduct.id, price: biscuitsPrice.id },
        swat: { product: swatProduct.id, price: swatPrice.id },
        roar: { product: roarProduct.id, price: roarPrice.id },
      },
      addons: {
        voice: { product: voiceAddonProduct.id, price: voiceAddonPrice.id },
        wakeup: { product: wakeupAddonProduct.id, price: wakeupAddonPrice.id },
        texts: { product: textsAddonProduct.id, price: textsAddonPrice.id },
        reminders: { product: remindersAddonProduct.id, price: remindersAddonPrice.id },
      },
    }
  } catch (error) {
    console.error('❌ Error creating products:', error)
    throw error
  }
}

// Run the setup
setupStripeProducts()
  .then((products) => {
    console.log('\n🎉 Setup complete! Now update your .env file with these price IDs.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error.message)
    process.exit(1)
  })
