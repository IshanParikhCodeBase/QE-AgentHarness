# Subscription Service — Business Rules Specification

## 1. Purpose

This specification defines the business rules governing subscription tiers, subscription durations, lifecycle management, upgrades, downgrades, renewals, cancellations, and eligibility for a subscription-based service.

## 2. Available Subscription Tiers

| Tier | Name    | Description                                                                    |
| ---- | ------- | ------------------------------------------------------------------------------ |
| 10   | Base    | Entry-level subscription providing core service functionality                  |
| 20   | Ultra   | Mid-level subscription providing additional features and benefits              |
| 30   | Premium | Highest-level subscription providing the complete set of features and benefits |

### Duration Options

Each subscription tier is available in the following durations:

* 1 month
* 3 months
* 12 months

A customer may select any supported duration for an eligible tier.

## 3. Core Business Rules

### BR-001 — Valid Subscription Tier

A subscription must belong to one of the supported tiers: **10, 20, or 30**.

### BR-002 — Valid Subscription Duration

A subscription duration must be **1, 3, or 12 months**.

### BR-003 — Single Active Subscription

A customer may have only **one active subscription** to the service at a time unless explicitly permitted by the business.

### BR-004 — Subscription Activation

A subscription becomes active only after successful payment authorization and completion of the subscription purchase process.

### BR-005 — Subscription Start Date

The subscription start date is the date on which the subscription becomes active, unless a future start date is explicitly supported.

### BR-006 — Subscription Expiry

A subscription expires at the end of its selected duration unless it is renewed or automatically renewed.

### BR-007 — Tier Hierarchy

The subscription hierarchy is:

**Base (10) < Ultra (20) < Premium (30)**

A higher tier must provide at least the capabilities available in lower tiers.

## 4. Upgrade Rules

### BR-008 — Tier Upgrade

A customer may upgrade from a lower tier to a higher tier.

Examples:

* Base → Ultra
* Base → Premium
* Ultra → Premium

### BR-009 — Upgrade Restrictions

A customer must not be allowed to upgrade to an invalid or unsupported tier.

### BR-010 — Upgrade Billing

If an upgrade occurs before the current subscription expires, the system should apply the configured business policy for unused subscription value, such as **proration, immediate additional billing, or next-cycle billing**.

## 5. Downgrade Rules

### BR-011 — Tier Downgrade

A customer may downgrade from a higher tier to a lower tier, subject to the service's downgrade policy.

Examples:

* Premium → Ultra
* Premium → Base
* Ultra → Base

### BR-012 — Downgrade Effective Date

A downgrade should preferably take effect at the **end of the current billing period** unless immediate downgrade is explicitly supported.

### BR-013 — Feature Removal

When a downgrade becomes effective, features available exclusively to the previous higher tier must no longer be accessible.

## 6. Renewal Rules

### BR-014 — Renewal Eligibility

An active subscription may be renewed before or after its expiry according to the configured renewal window.

### BR-015 — Automatic Renewal

If auto-renewal is enabled, the system should attempt to charge the customer's configured payment method at the end of the subscription period.

### BR-016 — Failed Renewal

If renewal payment fails, the subscription must enter the configured state, such as **Payment Failed, Grace Period, or Expired**.

### BR-017 — Renewal Tier

Unless the customer changes the plan, the subscription should renew using the same tier and duration.

## 7. Cancellation Rules

### BR-018 — Customer Cancellation

Customers may cancel an active subscription if cancellation is supported for the selected plan.

### BR-019 — Cancellation Timing

Cancellation should normally prevent future renewal while allowing the customer to retain access until the current subscription period ends.

### BR-020 — Refunds

Cancellation does not automatically imply a refund. Refund eligibility must follow the business's configured refund policy.

## 8. Payment Rules

### BR-021 — Successful Payment

A subscription must not become active if the required payment has not been successfully completed.

### BR-022 — Failed Payment

Failed payments must not result in an active subscription being created unless the business explicitly supports a grace period or other exception.

### BR-023 — Payment Amount

The amount charged must correspond to the customer's selected tier, duration, applicable taxes, discounts, and other applicable pricing rules.

## 9. Do's

* **Do** validate the subscription tier before creating or modifying a subscription.
* **Do** validate that the selected duration is 1, 3, or 12 months.
* **Do** maintain a clear subscription status such as Active, Cancelled, Payment Failed, or Expired.
* **Do** record subscription start and expiry dates.
* **Do** maintain an audit history of tier changes, renewals, cancellations, and payment events.
* **Do** clearly communicate the selected tier and duration before payment.
* **Do** prevent customers from accessing features that their current tier does not provide.
* **Do** handle failed payments consistently according to the configured payment policy.
* **Do** ensure renewal uses the correct tier, duration, and price.

## 10. Don'ts

* **Don't** create subscriptions with unsupported tiers or durations.
* **Don't** allow an expired or cancelled subscription to continue receiving paid-only benefits indefinitely.
* **Don't** activate a subscription when the required payment has failed.
* **Don't** silently change a customer's subscription tier.
* **Don't** remove access immediately on cancellation unless the business explicitly defines immediate cancellation.
* **Don't** assume that cancellation automatically means a refund.
* **Don't** allow a customer to have multiple active subscriptions unless explicitly supported.
* **Don't** change subscription pricing without applying the appropriate pricing/version rules.
* **Don't** lose the history of previous subscription states or transactions.

## 11. Example Valid Combinations

| Tier         | 1 Month | 3 Months | 12 Months |
| ------------ | ------: | -------: | --------: |
| Base (10)    |       ✓ |        ✓ |         ✓ |
| Ultra (20)   |       ✓ |        ✓ |         ✓ |
| Premium (30) |       ✓ |        ✓ |         ✓ |

## 12. Example Invalid Scenarios

* Tier 40 → **Invalid**
* Tier 20 with 6-month duration → **Invalid**
* Tier 10 with 24-month duration → **Invalid**
* Activating a subscription with a failed mandatory payment → **Invalid**
* Creating a second active subscription when only one is permitted → **Invalid**

## 13. Recommended Subscription States

The system should support, at minimum:

**Pending → Active → Cancelled / Expired**

Additional states such as **Payment Failed**, **Grace Period**, and **Suspended** may be introduced depending on the payment and account-management requirements.
