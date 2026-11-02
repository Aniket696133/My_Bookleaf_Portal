// BookLeaf Knowledge Base, split by category so each AI call only receives
// the slice it needs (cost control) instead of the entire KB.

export const COMPANY_SUMMARY =
  'BookLeaf Publishing is a self-publishing company in India and the US (Standard Free and Bestseller Breakthrough packages). ' +
  'We handle cover design, typesetting, ISBN assignment, printing, distribution and royalty management. ' +
  'In-house printing and warehouse are in Delhi; overflow goes to print partners Repro India and Epitome Books.';

export const TONE_GUIDELINES = `- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: use actual numbers, dates and statuses from the author context instead of vague reassurance.
- If something is BookLeaf's fault (delayed royalty, ISBN error), own it directly. No corporate deflection.
- If it needs escalation or investigation, give a clear timeline (e.g. "within 48 hours"), not open-ended promises.
- Always end with a clear next step for the author and/or the BookLeaf team.`;

// Maps ticket category -> KB key
export const CATEGORY_KEY = {
  'Royalty & Payments': 'royalty',
  'ISBN & Metadata Issues': 'isbn',
  'Printing & Quality': 'printing',
  'Distribution & Availability': 'distribution',
  'Book Status & Production Updates': 'production',
  'General Inquiry': 'general',
};

export const POLICIES = {
  royalty: `ROYALTY POLICY
- 80/20 split: 80% of net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold is Rs 1,000. Below that, royalties roll over to the next quarter.
- Payouts are by bank transfer to the account linked in the author's dashboard.
- Authors can see a per-platform royalty breakdown in their dashboard; we can share a line-by-line breakdown on request.
- Genuinely overdue payment: escalate with a 48-hour resolution timeline.`,

  isbn: `ISBN POLICY
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.
- An ISBN under the author's own imprint must be obtained by the author independently.
- ISBN errors (duplicate, wrong book linked, mismatch between platform and physical copy) are HIGH priority and escalated to the production team immediately. Give a 48-hour resolution timeline.`,

  printing: `PRINTING & QUALITY POLICY
- In-house printing handles most orders; overflow or special formats go to Repro India or Epitome Books.
- Standard print turnaround is 5-7 business days from order confirmation.
- For quality issues (misprints, binding defects, colour inconsistency) BookLeaf arranges a FREE reprint after verification. The author may need to share photos of the defective copy.`,

  distribution: `DISTRIBUTION POLICY
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.
- New listings go live 7-10 business days after publication is complete.
- A book showing as unavailable on a platform is usually a stock sync issue; the team can trigger a re-sync within 24-48 hours.`,

  production: `PRODUCTION STAGES
- Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors are emailed at each stage. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
- Be honest about the cause of a delay, never blame the author even if the delay is on their side; frame it collaboratively and give a specific updated timeline.`,

  general: `GENERAL
- Metadata updates (e.g. book description on Amazon) can be submitted through the dashboard or by emailing the BookLeaf team. Changes typically reflect on platforms within 3-5 business days.`,
};

// One short worked example per category (few-shot calibration for tone and structure).
export const EXAMPLES = {
  royalty: {
    q: 'I published my book 4 months ago and still haven\'t received any royalty.',
    a: 'I completely understand how frustrating it is to wait on royalties, and I am sorry for the worry. Royalties are calculated quarterly and paid within 45 days of the quarter ending, so your first payout falls in the next cycle. I have asked our accounts team to confirm your bank details are linked, and if anything is overdue we will resolve it within 48 hours. Next step: please check that your bank account is linked in your dashboard and reply here if it is not.',
  },
  isbn: {
    q: 'My book shows a different ISBN on Amazon than on the physical copy.',
    a: 'Thank you for flagging this. A mismatched ISBN is a serious data issue and we are treating it as high priority. I am escalating it to our production team right now and you will have an update within 48 hours. Next step: could you reply with a photo of the ISBN on your physical copy and the Amazon listing link?',
  },
  printing: {
    q: 'My author copies arrived with blurry images and misaligned pages.',
    a: 'I am truly sorry, that is not the quality we stand for. We will arrange a free reprint once we verify the defect. Could you share a few photos of the affected pages? Once verified, the reprint takes 5-7 business days. Next step: please reply with the photos and we will start straight away.',
  },
  distribution: {
    q: 'My book shows "Currently Unavailable" on Amazon.',
    a: 'Thanks for letting us know. This is usually a stock sync issue on the platform. I am triggering a re-sync with our distribution team now, and the listing should be live again within 24-48 hours. Next step: we will confirm here once it is back; tell us if it still shows unavailable after 48 hours.',
  },
  production: {
    q: 'It has been 3 weeks and my book is still in typesetting. When will it be done?',
    a: 'Thank you for checking in, I know waiting is hard. Your book is currently at the typesetting stage. [state the real reason for any delay from the author context] We expect to complete this by [specific date], and we will email you at each stage. Next step: our team will send you the proofs within [timeline].',
  },
  general: {
    q: 'Can I update my book description on Amazon after it is live?',
    a: 'Yes, you can. Send the updated description through your dashboard or email our team, and the change will reflect on platforms within 3-5 business days. Next step: submit the new text and we will confirm once it is live.',
  },
};
