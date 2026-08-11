/**
 * r2.server.ts — Server-only R2 utility.
 * NEVER import this from client-side code.
 * Uses the AWS S3-compatible API to talk to Cloudflare R2.
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "[R2] Missing environment variables. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // Required for R2 — path-style forces the SDK to use
    // endpoint/bucket/key rather than bucket.endpoint/key
    forcePathStyle: true,
  });
}

const BUCKET = () => {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error("[R2] R2_BUCKET_NAME is not set.");
  return b;
};

/**
 * Generate a 15-minute presigned PUT URL so the browser can upload
 * a file directly to R2 without routing through the app server.
 */
export async function createUploadUrl(
  fileKey: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET(),
    Key: fileKey,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 min
}

/**
 * Generate a 5-minute presigned GET URL so a designer can download
 * a file from R2 without making the bucket public.
 */
export async function createDownloadUrl(fileKey: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: fileKey,
  });
  return getSignedUrl(client, command, { expiresIn: 300 }); // 5 min
}
