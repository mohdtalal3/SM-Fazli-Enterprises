/**
 * Inquiry list stored in localStorage. Isomorphic: safe to import from
 * server components (guards on `window`) and from client scripts.
 */

export interface InquiryItem {
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  url: string;
  qty: number;
}

const STORAGE_KEY = 'ferrox-inquiry-v1';
export const INQUIRY_EVENT = 'inquiry:changed';

export function getInquiry(): InquiryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as InquiryItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: InquiryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode etc.) — keep in-memory behavior only */
  }
  window.dispatchEvent(new CustomEvent(INQUIRY_EVENT, { detail: { count: items.length } }));
}

export function addInquiryItem(
  partial: Omit<InquiryItem, 'qty'>,
  qty = 1
): InquiryItem[] {
  const items = getInquiry();
  const existing = items.find((i) => i.slug === partial.slug);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...partial, qty });
  }
  persist(items);
  return items;
}

export function removeInquiryItem(slug: string): InquiryItem[] {
  const items = getInquiry().filter((i) => i.slug !== slug);
  persist(items);
  return items;
}

export function setInquiryQty(slug: string, qty: number): InquiryItem[] {
  const items = getInquiry();
  const item = items.find((i) => i.slug === slug);
  if (item) item.qty = Math.max(1, Math.round(qty) || 1);
  persist(items);
  return items;
}

export function clearInquiry(): InquiryItem[] {
  persist([]);
  return [];
}

export function inquiryCount(): number {
  return getInquiry().length;
}

/** Build a wa.me deep link with a prefilled message. */
export function buildWhatsAppLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Human-readable plain-text summary of the inquiry list for WhatsApp/email. */
export function buildInquiryMessage(items: InquiryItem[], meta: { name: string; company: string; phone: string; email: string; message: string }): string {
  const lines: string[] = [];
  lines.push(`Hello, I would like to request a quote for the following items:`);
  lines.push('');
  for (const item of items) {
    lines.push(`• ${item.name} — Qty: ${item.qty}`);
  }
  lines.push('');
  if (meta.name) lines.push(`Name: ${meta.name}`);
  if (meta.company) lines.push(`Company: ${meta.company}`);
  if (meta.phone) lines.push(`Phone: ${meta.phone}`);
  if (meta.email) lines.push(`Email: ${meta.email}`);
  if (meta.message) {
    lines.push('');
    lines.push(`Message: ${meta.message}`);
  }
  return lines.join('\n');
}
