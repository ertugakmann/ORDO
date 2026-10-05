// Guests have no account, so we remember who they are in this browser.

export type SavedGuest = { id: number; name: string };

function key(partyId: number) {
  return `ordo-guest-${partyId}`;
}

export function loadGuest(partyId: number): SavedGuest | null {
  try {
    const saved = window.localStorage.getItem(key(partyId));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveGuest(partyId: number, guest: SavedGuest) {
  try {
    window.localStorage.setItem(key(partyId), JSON.stringify(guest));
  } catch {}
}

export function loadOrderId(partyId: number): number | null {
  try {
    const saved = window.localStorage.getItem(`ordo-order-${partyId}`);
    return saved ? Number(saved) : null;
  } catch {
    return null;
  }
}

export function saveOrderId(partyId: number, orderId: number) {
  try {
    window.localStorage.setItem(`ordo-order-${partyId}`, String(orderId));
  } catch {}
}

export function clearGuest(partyId: number) {
  try {
    window.localStorage.removeItem(key(partyId));
    window.localStorage.removeItem(`ordo-order-${partyId}`);
  } catch {}
}
