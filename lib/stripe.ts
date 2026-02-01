import Stripe from 'stripe'
import { updateUserSubscription, SUBSCRIPTION_PLANS } from './subscription'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Create checkout session for subscription
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planId: keyof typeof SUBSCRIPTION_PLANS,
  successUrl: string,
  cancelUrl: string
) {
  const plan = SUBSCRIPTION_PLANS[planId]
  
  if (!plan.stripe_price_id) {
    throw new Error(`No Stripe price ID configured for plan: ${planId}`)
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: planId === 'pro' ? 14 : undefined, // 14-day trial for Pro
        metadata: {
          userId,
          planId,
        },
      },
    })

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

// Handle webhook events
export async function handleWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error handling webhook event:', error)
    throw error
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId as keyof typeof SUBSCRIPTION_PLANS
  
  if (!userId || !planId) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  // Get the subscription
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  
  await updateUserSubscription(userId, {
    plan: planId,
    status: subscription.status as any,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  })
  
  console.log(`Subscription created for user ${userId}: ${planId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id)
    return
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id
  const planId = Object.entries(SUBSCRIPTION_PLANS).find(
    ([_, plan]) => plan.stripe_price_id === priceId
  )?.[0] as keyof typeof SUBSCRIPTION_PLANS

  if (!planId) {
    console.error('Unknown price ID:', priceId)
    return
  }

  await updateUserSubscription(userId, {
    plan: planId,
    status: subscription.status as any,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  })
  
  console.log(`Subscription updated for user ${userId}: ${planId} (${subscription.status})`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id)
    return
  }

  await updateUserSubscription(userId, {
    plan: 'free',
    status: 'canceled',
  })
  
  console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId
  
  if (!userId) return

  await updateUserSubscription(userId, {
    status: 'active',
  })
  
  console.log(`Payment succeeded for user ${userId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId
  
  if (!userId) return

  await updateUserSubscription(userId, {
    status: 'past_due',
  })
  
  console.log(`Payment failed for user ${userId}`)
}

// Get subscription details from Stripe
export async function getStripeSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error)
    return null
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string, immediately: boolean = false) {
  try {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId)
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    throw error
  }
}