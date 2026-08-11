/**
 * r2Fns.ts — TanStack Start server functions for R2 presigned URLs.
 *
 * These run exclusively on the server. The browser calls them via
 * TanStack's RPC transport — the R2 secret keys are NEVER sent to the client.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createUploadUrl, createDownloadUrl } from "./r2.server";

// ---------------------------------------------------------------------------
// Upload URL
// ---------------------------------------------------------------------------
const uploadInput = z.object({
  /** Original file name, e.g. "gerber.zip" */
  fileName: z.string().min(1),
  /** MIME type, e.g. "application/zip" */
  contentType: z.string().min(1),
  /** Order code used to namespace the key, e.g. "CC-2601" */
  orderCode: z.string().min(1),
});

export type UploadUrlInput = z.infer<typeof uploadInput>;

export type UploadUrlResult = {
  /** Presigned PUT URL valid for 15 minutes */
  uploadUrl: string;
  /** R2 object key, e.g. "orders/CC-2601/gerber.zip" */
  fileKey: string;
};

export const getUploadUrlFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadInput.parse(data))
  .handler(async ({ data }): Promise<UploadUrlResult> => {
    const fileKey = `orders/${data.orderCode}/${data.fileName}`;
    const uploadUrl = await createUploadUrl(fileKey, data.contentType);
    return { uploadUrl, fileKey };
  });

// ---------------------------------------------------------------------------
// Download URL
// ---------------------------------------------------------------------------
const downloadInput = z.object({
  /** R2 object key, e.g. "orders/CC-2601/gerber.zip" */
  storageKey: z.string().min(1),
});

export type DownloadUrlInput = z.infer<typeof downloadInput>;

export type DownloadUrlResult = {
  /** Presigned GET URL valid for 5 minutes */
  downloadUrl: string;
};

export const getDownloadUrlFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => downloadInput.parse(data))
  .handler(async ({ data }): Promise<DownloadUrlResult> => {
    const downloadUrl = await createDownloadUrl(data.storageKey);
    return { downloadUrl };
  });
