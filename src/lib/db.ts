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

const localCache: Record<CollectionName, Record<string, unknown>[]> = {
  users: [...seedUsers],
  orders: [...seedOrders],
  notifications: [...seedNotifications],
  activity_logs: [...seedActivity],
  expenses: [...seedExpenses],
};

function cloneRows<T extends { id: string }>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

async function getAppDb() {
  const fb = await getFirebase();
  if (!fb) throw new Error("Firebase is not initialized.");
  return fb.db;
}

function getLocalCollection<T extends { id: string }>(name: CollectionName): T[] {
  return cloneRows(localCache[name] as T[]);
}

function getLocalCollectionRef<T extends { id: string }>(name: CollectionName): T[] {
  return localCache[name] as T[];
}

export async function listAll<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  try {
    const db = await getAppDb();
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
  } catch (error) {
    console.warn(`[db] listAll(${name}) failed, using local fallback`, error);
    return getLocalCollection(name);
  }
}

export async function upsert<T extends { id: string }>(name: CollectionName, row: T): Promise<T> {
  try {
    const db = await getAppDb();
    await setDoc(doc(db, name, row.id), row as Record<string, unknown>, { merge: true });
    return row;
  } catch (error) {
    console.warn(`[db] upsert(${name}, ${row.id}) failed, using local fallback`, error);
    const collectionRef = getLocalCollectionRef<T>(name);
    const existingIndex = collectionRef.findIndex((item) => item.id === row.id);
    const cloned = { ...row };
    if (existingIndex > -1) {
      collectionRef[existingIndex] = cloned;
    } else {
      collectionRef.push(cloned);
    }
    return row;
  }
}

export async function remove(name: CollectionName, id: string): Promise<void> {
  try {
    const db = await getAppDb();
    await deleteDoc(doc(db, name, id));
    return;
  } catch (error) {
    console.warn(`[db] remove(${name}, ${id}) failed, using local fallback`, error);
    const collectionRef = getLocalCollectionRef<Record<string, unknown>>(name);
    const index = collectionRef.findIndex((item) => item.id === id);
    if (index > -1) collectionRef.splice(index, 1);
  }
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
    try {
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
    } catch (error) {
      console.warn(`[db] watchCollection(${name}) failed, using local fallback`, error);
      if (!closed) {
        onChange(getLocalCollection(name));
      }
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
