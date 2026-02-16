/* Email Finder Pro — Background Service Worker */

importScripts('ExtPay.js');
const extpay = ExtPay('email-finder-pro');
extpay.startBackground();

// ── Daily usage tracking ──
async function getUsageToday() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get(['usage_date', 'usage_count']);
  if (data.usage_date === today) return data.usage_count || 0;
  await chrome.storage.local.set({ usage_date: today, usage_count: 0 });
  return 0;
}

async function incrementUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const count = await getUsageToday();
  await chrome.storage.local.set({ usage_date: today, usage_count: count + 1 });
  return count + 1;
}

async function isPro() {
  try {
    const user = await extpay.getUser();
    return user.paid;
  } catch { return false; }
}

async function canLookup() {
  if (await isPro()) return { allowed: true, remaining: Infinity };
  const used = await getUsageToday();
  const FREE_LIMIT = 10;
  return { allowed: used < FREE_LIMIT, remaining: Math.max(0, FREE_LIMIT - used) };
}

// ── MX Record Check via Google DNS-over-HTTPS ──
async function checkMX(domain) {
  try {
    const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    const data = await resp.json();
    if (data.Answer && data.Answer.length > 0) {
      return { valid: true, records: data.Answer.map(a => a.data) };
    }
    return { valid: false, records: [] };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ── Email pattern generation ──
function generateEmails(firstName, lastName, domain) {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().replace(/[^a-z]/g, '');
  if (!f || !l || !domain) return [];
  return [
    `${f}@${domain}`,
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${f[0]}${l}@${domain}`,
    `${f}${l[0]}@${domain}`,
    `${l}@${domain}`,
    `${f}_${l}@${domain}`,
    `${f}-${l}@${domain}`,
  ];
}

// ── Contact storage ──
async function saveContact(contact) {
  const data = await chrome.storage.local.get('contacts');
  const contacts = data.contacts || [];
  const exists = contacts.findIndex(c => c.id === contact.id);
  if (exists >= 0) {
    contacts[exists] = { ...contacts[exists], ...contact, updatedAt: Date.now() };
  } else {
    contact.id = contact.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    contact.createdAt = Date.now();
    contacts.push(contact);
  }
  await chrome.storage.local.set({ contacts });
  return contact;
}

async function getContacts(query) {
  const data = await chrome.storage.local.get('contacts');
  let contacts = data.contacts || [];
  if (query) {
    const q = query.toLowerCase();
    contacts = contacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q)
    );
  }
  return contacts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function deleteContact(id) {
  const data = await chrome.storage.local.get('contacts');
  const contacts = (data.contacts || []).filter(c => c.id !== id);
  await chrome.storage.local.set({ contacts });
}

// ── Message handler ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handle = async () => {
    switch (msg.action) {
      case 'checkAccess': {
        const access = await canLookup();
        const pro = await isPro();
        return { ...access, pro };
      }
      case 'lookup': {
        const access = await canLookup();
        if (!access.allowed) return { error: 'limit', remaining: 0 };
        const { firstName, lastName, domain } = msg;
        const emails = generateEmails(firstName, lastName, domain);
        const mx = await checkMX(domain);
        await incrementUsage();
        const newAccess = await canLookup();
        return { emails, mx, remaining: newAccess.remaining };
      }
      case 'verifyDomain': {
        return await checkMX(msg.domain);
      }
      case 'saveContact': {
        return await saveContact(msg.contact);
      }
      case 'getContacts': {
        return await getContacts(msg.query);
      }
      case 'deleteContact': {
        await deleteContact(msg.id);
        return { success: true };
      }
      case 'isPro': {
        return { pro: await isPro() };
      }
      case 'openPayment': {
        extpay.openPaymentPage();
        return { ok: true };
      }
      case 'bulkLookup': {
        const pro = await isPro();
        if (!pro) return { error: 'pro_required' };
        const results = [];
        for (const person of msg.people) {
          const emails = generateEmails(person.firstName, person.lastName, person.domain);
          const mx = await checkMX(person.domain);
          results.push({ ...person, emails, mx });
        }
        return { results };
      }
      default:
        return { error: 'unknown_action' };
    }
  };
  handle().then(sendResponse);
  return true; // async
});
