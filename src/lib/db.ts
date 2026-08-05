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

/** Reads a collection from Firestore when configured, otherwise from local storage. */
export async function listAll<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  const fb = await getFirebase();
  if (fb) {
    try {
      const snap = await getDocs(collection(fb.db, name));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
      }
    } catch (error) {
      console.warn(`[db] firestore read failed for ${name}`, error);
    }
  }
  return readLocal<T>(name);
}

export async function upsert<T extends { id: string }>(name: CollectionName, row: T): Promise<T> {
  const fb = await getFirebase();
  if (fb) {
    try {
      await setDoc(doc(fb.db, name, row.id), row as Record<string, unknown>, { merge: true });
    } catch (error) {
      console.warn(`[db] firestore write failed for ${name}`, error);
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
  const fb = await getFirebase();
  if (fb) {
    try {
      await deleteDoc(doc(fb.db, name, id));
    } catch (error) {
      console.warn(`[db] firestore delete failed for ${name}`, error);
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
  let closed = false;
  let unsubscribe: (() => void) | undefined;

  void (async () => {
    const fb = await getFirebase();
    if (!fb || closed) return;
    try {
      unsubscribe = onSnapshot(collection(fb.db, name), (snap) => {
        if (closed) return;
        onChange(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
      });
    } catch (error) {
      console.warn(`[db] firestore watch failed for ${name}`, error);
    }
  })();

  return () => {
    closed = true;
    unsubscribe?.();
  };
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
