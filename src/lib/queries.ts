import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listActivity, listExpenses, listNotifications, listOrders, listUsers, watchCollection } from "./db";

export const useOrders = () => useQuery({ queryKey: ["orders"], queryFn: listOrders });
export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: listUsers });
export const useNotifications = () =>
  useQuery({ queryKey: ["notifications"], queryFn: listNotifications });
export const useActivity = () => useQuery({ queryKey: ["activity"], queryFn: listActivity });
export const useExpenses = () => useQuery({ queryKey: ["expenses"], queryFn: listExpenses });

export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries();
  };
}

const DATA_KEYS_PREFIX = "codecrew:";

export function useDataSync(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const windowAvailable = typeof window !== "undefined";
    if (!windowAvailable) return;

    const unsubs = [
      watchCollection("orders", () => {
        void qc.invalidateQueries({ queryKey: ["orders"] });
      }),
      watchCollection("users", () => {
        void qc.invalidateQueries({ queryKey: ["users"] });
      }),
      watchCollection("notifications", () => {
        void qc.invalidateQueries({ queryKey: ["notifications"] });
      }),
      watchCollection("activity_logs", () => {
        void qc.invalidateQueries({ queryKey: ["activity"] });
      }),
      watchCollection("expenses", () => {
        void qc.invalidateQueries({ queryKey: ["expenses"] });
      }),
    ];

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith(DATA_KEYS_PREFIX)) {
        void qc.invalidateQueries();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [qc, enabled]);
}
