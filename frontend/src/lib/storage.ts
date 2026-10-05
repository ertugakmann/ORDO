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
