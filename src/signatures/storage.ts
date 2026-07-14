import type { SignatureData } from '../core/types.ts';

const STORAGE_KEY = 'saved-signatures';

export interface SavedSignature {
  id: string;
  categoryId: string;
  categoryLabel: string;
  label: string;
  html: string;
  fingerprint: string;
  savedAt: string;
}

/** Order-independent snapshot of the data that actually varies a signature — used to detect duplicates. */
export function computeFingerprint(data: SignatureData): string {
  const entries = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function getSavedSignatures(): SavedSignature[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSignature[]) : [];
  } catch {
    return [];
  }
}

export function findDuplicate(categoryId: string, fingerprint: string): SavedSignature | undefined {
  return getSavedSignatures().find((s) => s.categoryId === categoryId && s.fingerprint === fingerprint);
}

export function saveSignature(entry: Omit<SavedSignature, 'id' | 'savedAt'>): SavedSignature {
  const saved = getSavedSignatures();
  const newEntry: SavedSignature = {
    ...entry,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  saved.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return newEntry;
}

export function deleteSignature(id: string): void {
  const saved = getSavedSignatures().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}
