/**
 * Stripe Product Setup Script
 * Creates all subscription products and prices for Meowdel
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products for Meowdel...\n')

  try {
    // Product 1: Purr ($9/month)
    console.log('Creating Purr tier...')
    const purrProduct = await stripe.products.create({
      name: 'Meowdel Purr',
      description: '1,000 messages/month with Meowdel and all cat personalities',
      metadata: {
        tier: 'purr',
        messages_limit: '1000',
        features: 'all_personalities,priority_responses,email_support,early_access',
      },
    })

    const purrPrice = await stripe.prices.create({
      product: purrProduct.id,
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'purr',
      },
    })

    console.log(`✅ Purr Product: ${purrProduct.id}`)
    console.log(`✅ Purr Price: ${purrPrice.id}\n`)

    // Product 2: Meow ($29/month)
    console.log('Creating Meow tier...')
    const meowProduct = await stripe.products.create({
      name: 'Meowdel Meow',
      description: '5,000 messages/month with vision capabilities and voice features',
      metadata: {
        tier: 'meow',
        messages_limit: '5000',
        features: 'all_purr_features,vision_upload,voice_features,api_access,priority_support',
      },
    })

    const meowPrice = await stripe.prices.create({
      product: meowProduct.id,
      unit_amount: 2900, // $29.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'meow',
      },
    })

    console.log(`✅ Meow Product: ${meowProduct.id}`)
    console.log(`✅ Meow Price: ${meowPrice.id}\n`)

    // Product 3: Roar ($99/month)
    console.log('Creating Roar tier...')
    const roarProduct = await stripe.products.create({
      name: 'Meowdel Roar',
      description: 'Unlimited messages with phone, SMS, WhatsApp, and all premium features',
      metadata: {
        tier: 'roar',
        messages_limit: 'unlimited',
        features: 'all_meow_features,unlimited_messages,phone_access,sms_access,whatsapp,petalarm,white_label,dedicated_support',
      },
    })

    const roarPrice = await stripe.prices.create({
      product: roarProduct.id,
      unit_amount: 9900, // $99.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'roar',
      },
    })

    console.log(`✅ Roar Product: ${roarProduct.id}`)
    console.log(`✅ Roar Price: ${roarPrice.id}\n`)

    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ ALL PRODUCTS CREATED SUCCESSFULLY!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('Add these Price IDs to your .env file:\n')
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_PURR=${purrPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MEOW=${meowPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ROAR=${roarPrice.id}`)

    console.log('\nOr update pricing/page.tsx directly with these IDs:')
    console.log(`\nPurr: ${purrPrice.id}`)
    console.log(`Meow: ${meowPrice.id}`)
    console.log(`Roar: ${roarPrice.id}`)

    return {
      purr: { product: purrProduct.id, price: purrPrice.id },
      meow: { product: meowProduct.id, price: meowPrice.id },
      roar: { product: roarProduct.id, price: roarPrice.id },
    }
  } catch (error) {
    console.error('❌ Error creating products:', error)
    throw error
  }
}

// Run the setup
setupStripeProducts()
  .then((products) => {
    console.log('\n🎉 Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error.message)
    process.exit(1)
  })
