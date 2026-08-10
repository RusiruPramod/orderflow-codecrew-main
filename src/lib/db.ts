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

async function getAppDb() {
  const fb = await getFirebase();
  if (!fb) throw new Error("Firebase is not initialized.");
  return fb.db;
}

export async function listAll<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  const db = await getAppDb();
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

export async function upsert<T extends { id: string }>(name: CollectionName, row: T): Promise<T> {
  const db = await getAppDb();
  await setDoc(doc(db, name, row.id), row as Record<string, unknown>, { merge: true });
  return row;
}

export async function remove(name: CollectionName, id: string): Promise<void> {
  const db = await getAppDb();
  await deleteDoc(doc(db, name, id));
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
    const db = await getAppDb();
    if (closed) return;
    unsubscribe = onSnapshot(
      collection(db, name),
      (snap) => {
        if (closed) return;
        onChange(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
      },
      (error) => {
        if (closed) return;
        console.error(`[db] firestore watch failed for ${name}`, error);
        unsubscribe?.();
      },
    );
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

async function seedCollection<T extends { id: string }>(
  db: ReturnType<typeof getAppDb> extends Promise<infer U> ? U : never,
  name: CollectionName,
  rows: T[],
) {
  const snap = await getDocs(collection(db, name));
  const existingIds = new Set(snap.docs.map((doc) => doc.id));
  const missingRows = rows.filter((row) => !existingIds.has(row.id));

  for (const row of missingRows) {
    await setDoc(doc(db, name, row.id), row as Record<string, unknown>);
  }
}

export async function seedFirestore() {
  const db = await getAppDb();
  await seedCollection(db, "users", seedUsers);
  await seedCollection(db, "orders", seedOrders);
  await seedCollection(db, "notifications", seedNotifications);
  await seedCollection(db, "activity_logs", seedActivity);
  await seedCollection(db, "expenses", seedExpenses);
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
