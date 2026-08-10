import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import {
  seedActivity,
  seedExpenses,
  seedNotifications,
  seedOrders,
  seedUsers,
} from "./seed";
import type { ActivityLog, AppUser, Expense, Notification, Order } from "./types";

export type CollectionName = "orders" | "users" | "notifications" | "activity_logs" | "expenses";

const disabledCollections = new Set<CollectionName>();

const SEEDS: Record<CollectionName, unknown[]> = {
  orders: seedOrders,
  users: seedUsers,
  notifications: seedNotifications,
  activity_logs: seedActivity,
  expenses: seedExpenses,
};

const key = (name: CollectionName) => `codecrew:${name}`;

function readLocal<T>(name: CollectionName): T[] {
  if (typeof window === "undefined") return SEEDS[name] as T[];
  const raw = window.localStorage.getItem(key(name));
  if (!raw) {
    window.localStorage.setItem(key(name), JSON.stringify(SEEDS[name]));
    return SEEDS[name] as T[];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return SEEDS[name] as T[];
  }
}

function writeLocal<T>(name: CollectionName, rows: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(name), JSON.stringify(rows));
}

function mergeRows<T extends { id: string }>(primary: T[], fallback: T[]): T[] {
  const rows = new Map<string, T>();
  for (const row of fallback) rows.set(row.id, row);
  for (const row of primary) rows.set(row.id, row);
  return Array.from(rows.values());
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

function isCollectionDisabled(name: CollectionName) {
  return disabledCollections.has(name);
}

function disableFirestore(error: unknown, name: CollectionName) {
  if (isPermissionDenied(error)) {
    if (!disabledCollections.has(name)) {
      disabledCollections.add(name);
      console.warn(`[db] firestore disabled for ${name}; falling back to local data`, error);
    }
  } else if (!disabledCollections.has(name)) {
    console.warn(`[db] firestore operation failed for ${name}`, error);
  }
}

/** Reads a collection from Firestore when configured, otherwise from local storage. */
export async function listAll<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  if (isCollectionDisabled(name)) return readLocal<T>(name);
  const fb = await getFirebase();
  if (fb) {
    try {
      const snap = await getDocs(collection(fb.db, name));
      const remoteRows = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
      const localRows = readLocal<T>(name);
      if (!snap.empty) return mergeRows(remoteRows, localRows);
    } catch (error) {
      disableFirestore(error, name);
    }
  }
  return readLocal<T>(name);
}

export async function upsert<T extends { id: string }>(name: CollectionName, row: T): Promise<T> {
  const fb = isCollectionDisabled(name) ? null : await getFirebase();
  if (fb) {
    try {
      await setDoc(doc(fb.db, name, row.id), row as Record<string, unknown>, { merge: true });
    } catch (error) {
      disableFirestore(error, name);
    }
  }
  const rows = readLocal<T>(name);
  const index = rows.findIndex((r) => r.id === row.id);
  if (index >= 0) rows[index] = row;
  else rows.unshift(row);
  writeLocal(name, rows);
  return row;
}

export async function remove(name: CollectionName, id: string): Promise<void> {
  const fb = isCollectionDisabled(name) ? null : await getFirebase();
  if (fb) {
    try {
      await deleteDoc(doc(fb.db, name, id));
    } catch (error) {
      disableFirestore(error, name);
    }
  }
  writeLocal(
    name,
    readLocal<{ id: string }>(name).filter((r) => r.id !== id),
  );
}

export const listOrders = () => listAll<Order>("orders");
export const listUsers = () => listAll<AppUser>("users");
export const listNotifications = () => listAll<Notification>("notifications");
export const listActivity = () => listAll<ActivityLog>("activity_logs");
export const listExpenses = () => listAll<Expense>("expenses");

export function watchCollection<T extends { id: string }>(
  name: CollectionName,
  onChange: (rows: T[]) => void,
): () => void {
  if (isCollectionDisabled(name)) return () => undefined;
  let closed = false;
  let unsubscribe: (() => void) | undefined;

  void (async () => {
    const fb = await getFirebase();
    if (!fb || closed) return;
    try {
      unsubscribe = onSnapshot(collection(fb.db, name), (snap) => {
        if (closed) return;
        onChange(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
      }, (error) => {
        if (closed) return;
        disableFirestore(error, name);
        unsubscribe?.();
      });
    } catch (error) {
      disableFirestore(error, name);
    }
  })();

  return () => {
    closed = true;
    unsubscribe?.();
  };
}

export function resetFirestoreFallback() {
  disabledCollections.clear();
}

export async function logActivity(entry: Omit<ActivityLog, "id" | "createdAt">) {
  await upsert<ActivityLog>("activity_logs", {
    ...entry,
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  });
}

export async function notify(entry: Omit<Notification, "id" | "createdAt" | "read">) {
  await upsert<Notification>("notifications", {
    ...entry,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function nextOrderCode(orders: Order[]): string {
  const numbers = orders
    .map((o) => Number.parseInt(o.code.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const max = numbers.length ? Math.max(...numbers) : 2600;
  return `CC-${max + 1}`;
}
