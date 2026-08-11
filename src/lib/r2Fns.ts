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
    console.log(`[R2 Server] Generating upload URL for key: ${fileKey}`);
    try {
      const uploadUrl = await createUploadUrl(fileKey, data.contentType);
      return { uploadUrl, fileKey };
    } catch (err) {
      console.error("[R2 Server Error] Failed to generate presigned upload URL:", err);
      throw err;
    }
  });

// ---------------------------------------------------------------------------
// Download URL
// ---------------------------------------------------------------------------
const downloadInput = z.object({
  /** R2 object key, e.g. "orders/CC-2601/gerber.zip" */
  storageKey: z.string().min(1),
  /** Original file name for Content-Disposition header, e.g. "PCB.json" */
  fileName: z.string().optional(),
});

export type DownloadUrlInput = z.infer<typeof downloadInput>;

export type DownloadUrlResult = {
  /** Presigned GET URL valid for 5 minutes */
  downloadUrl: string;
};

export const getDownloadUrlFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => downloadInput.parse(data))
  .handler(async ({ data }): Promise<DownloadUrlResult> => {
    const downloadUrl = await createDownloadUrl(data.storageKey, data.fileName);
    return { downloadUrl };
  });

/**
 * Helper to download an R2 file directly to the user's computer without opening a new tab or navigating.
 */
export async function downloadR2File(storageKey: string, fileName: string) {
  const { downloadUrl } = await getDownloadUrlFn({ data: { storageKey, fileName } });

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (fetchErr) {
    console.warn("Direct blob download failed, falling back to presigned URL trigger:", fetchErr);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

