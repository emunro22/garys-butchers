/**
 * One-time backfill: sends the "leave us a review" email to every existing
 * customer who has an order due today or in the past — one email per
 * customer, not per order. See src/lib/review-backfill.ts for the full
 * eligibility rules.
 *
 * Run with:
 *   npm run db:send-review-backfill -- --dry-run   (report counts only)
 *   npm run db:send-review-backfill                (actually send)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getReviewBackfillCandidates, runReviewBackfill } from '../src/lib/review-backfill';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (DRY_RUN) {
    const { dueOrEarlier, byEmail } = await getReviewBackfillCandidates();
    console.log(
      `${dueOrEarlier.length} already-due orders across ${byEmail.size} customers are eligible for the backfill.`
    );
    console.log('\n--dry-run: no emails sent, no rows updated. Sample:');
    for (const order of Array.from(byEmail.values()).slice(0, 10)) {
      console.log(`  #${String(order.orderNumber).padStart(5, '0')}  ${order.customerName} <${order.customerEmail}>`);
    }
    return;
  }

  const result = await runReviewBackfill();
  console.log(
    `${result.eligibleOrders} already-due orders across ${result.eligibleCustomers} customers.\n` +
      `Sent ${result.sent} review request emails (${result.failed} failed, left unsent for retry).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
