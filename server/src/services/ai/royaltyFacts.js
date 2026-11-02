import { ROYALTY_PAYOUT_THRESHOLD } from '../../constants.js';

const DAY = 86400000;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const rupees = (n) => (n == null ? 'n/a' : `Rs ${Number(n).toLocaleString('en-IN')}`);
export { fmtDate };

// Quarter ends are 31 Mar / 30 Jun / 30 Sep / 31 Dec; payout is due within 45 days after.
export function nextPayoutDeadline(now = new Date()) {
  const y = now.getUTCFullYear();
  const deadlines = [];
  for (const yr of [y - 1, y, y + 1]) {
    for (const m of [2, 5, 8, 11]) {
      const quarterEnd = new Date(Date.UTC(yr, m + 1, 0));
      deadlines.push({ quarterEnd, deadline: new Date(quarterEnd.getTime() + 45 * DAY) });
    }
  }
  return deadlines.sort((a, b) => a.deadline - b.deadline).find((d) => d.deadline >= now);
}

// Facts are computed in code (not left to the model) so numbers in drafts are reliable.
export function describeBook(book) {
  if (!book.publicationDate) {
    return `"${book.title}": NOT yet published. Current production stage: ${book.status}. No sales or royalties yet.`;
  }
  const lines = [
    `"${book.title}" (${book.genre}), status: ${book.status}, published ${fmtDate(book.publicationDate)}, ISBN ${book.isbn}, MRP ${rupees(book.mrp)}`,
    `Print partner: ${book.printPartner || 'n/a'}. Available on: ${book.availableOn.join(', ') || 'no platforms yet'}.`,
    `Copies sold: ${book.copiesSold}. Royalty per copy: ${rupees(book.royaltyPerCopy)}. Earned: ${rupees(book.royaltyEarned)}, paid: ${rupees(book.royaltyPaid)}, pending: ${rupees(book.royaltyPending)}.`,
    book.lastRoyaltyPayoutDate
      ? `Last payout: ${fmtDate(book.lastRoyaltyPayoutDate)}.`
      : 'No royalty payout has been made yet for this book.',
  ];
  if (book.royaltyPending > 0 && book.royaltyPending < ROYALTY_PAYOUT_THRESHOLD) {
    lines.push(`Pending amount is BELOW the Rs ${ROYALTY_PAYOUT_THRESHOLD} minimum payout threshold, so it rolls over to the next quarter.`);
  }
  return lines.join('\n');
}

export function payoutCycleNote(now = new Date()) {
  const n = nextPayoutDeadline(now);
  return `Next payout deadline: ${fmtDate(n.deadline)} (45 days after the quarter ending ${fmtDate(n.quarterEnd)}). Today is ${fmtDate(now)}.`;
}
