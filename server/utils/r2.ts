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

export async function listR2Objects() {
  const client = getR2Client();
  const config = useRuntimeConfig();
  const endpoint = getR2Endpoint();

  const url = `${endpoint}/${config.r2BucketName}?list-type=2`;
  const response = await client.fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.statusText}`);
  }

  const text = await response.text();
  const objects: Array<{ key: string; size: number; lastModified: Date }> = [];

  const keyMatches = text.matchAll(/<Key>(.*?)<\/Key>/g);
  const sizeMatches = text.matchAll(/<Size>(.*?)<\/Size>/g);
  const dateMatches = text.matchAll(/<LastModified>(.*?)<\/LastModified>/g);

  const keys = Array.from(keyMatches).map((m) => m[1]);
  const sizes = Array.from(sizeMatches).map((m) => parseInt(m[1]));
  const dates = Array.from(dateMatches).map((m) => new Date(m[1]));

  for (let i = 0; i < keys.length; i++) {
    objects.push({
      key: keys[i],
      size: sizes[i],
      lastModified: dates[i],
    });
  }

  return objects;
}
