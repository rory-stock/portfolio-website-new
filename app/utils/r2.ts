import { AwsClient } from "aws4fetch";

let r2Client: AwsClient | null = null;

function getR2Client() {
  if (r2Client) return r2Client;

  const config = useRuntimeConfig();

  r2Client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  });

  return r2Client;
}

function getR2Endpoint() {
  const config = useRuntimeConfig();
  return `https://${config.r2AccountId}.r2.cloudflarestorage.com`;
}

export async function generatePresignedUploadUrl(key: string): Promise<string> {
  const client = getR2Client();
  const config = useRuntimeConfig();
  const endpoint = getR2Endpoint();

  const url = `${endpoint}/${config.r2BucketName}/${key}?X-Amz-Expires=3600`;

  const signedRequest = await client.sign(new Request(url, { method: "PUT" }), {
    aws: { signQuery: true },
  });

  return signedRequest.url;
}

export async function getR2Object(key: string) {
  const client = getR2Client();
  const config = useRuntimeConfig();
  const endpoint = getR2Endpoint();

  const url = `${endpoint}/${config.r2BucketName}/${key}`;
  const response = await client.fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get object: ${response.statusText}`);
  }

  return response.body;
}

export async function deleteR2Object(key: string) {
  const client = getR2Client();
  const config = useRuntimeConfig();
  const endpoint = getR2Endpoint();

  const url = `${endpoint}/${config.r2BucketName}/${key}`;
  const response = await client.fetch(url, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete object: ${response.statusText}`);
  }
}

/**
 * List all objects in the R2 bucket.
 */
export async function listR2Objects() {
  const client = getR2Client();
  const config = useRuntimeConfig();
  const endpoint = getR2Endpoint();

  const allObjects: Array<{ key: string; size: number; lastModified: Date }> =
    [];
  let continuationToken: string | null = null;

  do {
    const params = new URLSearchParams({ "list-type": "2" });
    if (continuationToken) {
      params.set("continuation-token", continuationToken);
    }

    const url = `${endpoint}/${config.r2BucketName}?${params.toString()}`;
    const response = await client.fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to list objects: ${response.statusText}`);
    }

    const text = await response.text();

    // Parse objects from this page
    const pageObjects = parseListObjectsResponse(text);
    allObjects.push(...pageObjects);

    // Check for more pages
    const isTruncated = /<IsTruncated>true<\/IsTruncated>/i.test(text);

    if (isTruncated) {
      const tokenMatch = text.match(
        /<NextContinuationToken>(.*?)<\/NextContinuationToken>/
      );
      continuationToken = tokenMatch?.[1] ?? null;

      // Safety: if truncated but no token, break to avoid infinite loop
      if (!continuationToken) break;
    } else {
      continuationToken = null;
    }
  } while (continuationToken);

  return allObjects;
}

/**
 * Parse the XML response from S3 ListObjectsV2 into structured objects.
 */
function parseListObjectsResponse(
  xml: string
): Array<{ key: string; size: number; lastModified: Date }> {
  const objects: Array<{ key: string; size: number; lastModified: Date }> = [];

  const contentsBlocks = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);

  for (const block of contentsBlocks) {
    const content = block[1];
    if (!content) continue;

    const keyMatch = content.match(/<Key>(.*?)<\/Key>/);
    const sizeMatch = content.match(/<Size>(.*?)<\/Size>/);
    const dateMatch = content.match(/<LastModified>(.*?)<\/LastModified>/);

    if (!keyMatch?.[1] || !sizeMatch?.[1] || !dateMatch?.[1]) continue;

    objects.push({
      key: keyMatch[1],
      size: parseInt(sizeMatch[1]),
      lastModified: new Date(dateMatch[1]),
    });
  }

  return objects;
}
