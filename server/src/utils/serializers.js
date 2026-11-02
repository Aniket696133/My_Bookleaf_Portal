// Authors must never see AI reasoning, drafts, assignee or classification provenance.
export function toAuthorTicket(ticket) {
  const t = ticket.toObject ? ticket.toObject() : ticket;
  return {
    _id: t._id,
    subject: t.subject,
    description: t.description,
    status: t.status,
    book: t.book ? { _id: t.book._id, title: t.book.title } : null,
    attachments: t.attachments,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function toPublicMessage(m) {
  return { _id: m._id, senderRole: m.senderRole, senderName: m.senderName, body: m.body, createdAt: m.createdAt };
}
