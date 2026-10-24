import type { SampleDoc } from "./types";

/**
 * Seeded documents so anyone can try the full flow immediately.
 * All three are original, written for this project.
 */
export const SAMPLES: SampleDoc[] = [
  {
    id: "product-sync",
    title: "Product sync — checkout revamp",
    docType: "meeting",
    text: `Weekly product sync, checkout revamp team. Attendees: Ayesha (PM), Daniyal (engineering lead), Priya (design), Marcus (support).

Ayesha opened with the numbers. Cart abandonment on mobile rose to 71 percent last week, up from 66 percent, and the new one-page checkout test showed a 9 percent lift in completed orders on desktop but almost no change on mobile. Daniyal said the mobile payment sheet is the likely culprit because it reloads after the keyboard opens, which loses the entered card details for some Android users.

We discussed two options for the payment step: keep the current embedded form and patch the reload bug, or move to the hosted payment page from our provider. Priya argued the hosted page breaks the visual flow and would need a design pass. After comparing effort, the team decided to patch the reload bug first and ship it behind a flag this sprint, and to revisit the hosted page only if abandonment does not improve. We also confirmed that guest checkout stays the default and account creation remains optional after purchase.

Daniyal will investigate the Android payment-sheet reload and share findings by Wednesday. Priya to review the patched flow on a real device and sign off before release. Ayesha will set up the abandonment dashboard split by device so we can see the effect of the patch by Friday. Marcus to collect five recent support tickets about lost card details and add them to the bug report today.

Open questions: Do we have budget approval for the address-autocomplete service, or do we keep the manual fields for another quarter? Who owns the final call on the order-confirmation email redesign? The analytics events for the new funnel are still not defined, and nobody was sure whether marketing needs the extra attribution fields before launch.`,
  },
  {
    id: "focus-article",
    title: "Research digest — the case for meeting-free mornings",
    docType: "article",
    text: `The case for meeting-free mornings

A growing body of workplace research suggests that the first hours of the day are the most valuable for demanding cognitive work, and the first thing most organisations do with them is fill them with status meetings. In one widely cited internal study at a large software firm, engineers who kept their mornings free of meetings completed focused coding tasks 23 percent faster and reported significantly lower end-of-day fatigue than matched colleagues whose mornings were booked.

The mechanism is not mysterious. Attention researchers describe a cost every time a worker switches context: after a meeting ends, it takes an average of 15 to 20 minutes to return to the previous depth of concentration. Three morning meetings can therefore consume not just their scheduled hour, but most of the productive morning around them. Calendar fragmentation also pushes deep work into evenings, which correlates with worse sleep and higher turnover over the following year.

Critics of meeting-free policies raise fair points. Distributed teams across time zones may only overlap in someone else's morning, and a blanket ban can simply move the pile-up to the afternoon, creating a different kind of exhaustion. The studies that show the strongest effects did not ban meetings outright; they protected two or three mornings a week and moved status updates to asynchronous written formats. Teams also kept a short daily stand-up, but scheduled it late in the morning rather than at the start of the day.

The practical recommendation from the research is modest: pick two mornings a week, block them at the team level rather than individually, move recurring status meetings to written updates, and measure the result for a month before deciding. Whether the effect holds for creative and managerial work, which is less easily measured than coding output, remains an open question, and most of the published work still comes from software companies in a handful of countries.`,
  },
  {
    id: "support-thread",
    title: "Support thread — duplicate invoice charges",
    docType: "email",
    text: `Subject: Duplicate charge on invoice 8841 — thread summary

From: Lena (Support, tier 1)
A customer wrote in on Monday saying she was charged twice for invoice 8841, once on her card ending 4417 and once by direct debit. I checked the billing console and both payments show as settled. I refunded neither yet because the amounts differ by a small fee and I was not sure which one to reverse. Escalating to tier 2 with the payment IDs attached.

From: Omar (Support, tier 2)
I traced both payments. The card payment was the original; the direct debit was created when the customer's bank retried after a timeout, so the duplicate is on our side, not the bank's. I have refunded the direct debit payment in full and emailed the customer an apology with the refund timeline of 3 to 5 working days. This is the fourth duplicate-charge case this month with the same pattern, all after payment timeouts.

From: Sofia (Billing engineering)
The pattern matches a known weakness in the retry logic: when a payment times out, the system cannot tell whether it succeeded, and the retry creates a second charge instead of checking the first one's status. We agreed on the fix in today's triage: before any retry, the system must query the payment provider for the status of the original attempt. I will open the engineering ticket and put the fix in the next sprint. Omar to send Sofia the four case IDs from this month so the fix covers all of them.

Still open: should we proactively scan for other duplicate charges from the last 90 days and refund them without waiting for customers to complain? Finance needs to confirm whether that requires approval above a total threshold. The customer in this thread has been refunded and replied that she is satisfied, so the thread itself can be closed once the scan question is answered.`,
  },
];
