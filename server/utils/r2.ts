import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;

export function getR2Client() {
  if (r2Client) return r2Client;

  const config = useRuntimeConfig();

  if (
    !config.r2AccountId ||
    !config.r2AccessKeyId ||
    !config.r2SecretAccessKey
  ) {
    throw new Error("R2 configuration missing");
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  });

  return r2Client;
}

export async function generatePresignedUploadUrl(key: string) {
  const client = getR2Client();
  const config = useRuntimeConfig();

  const command = new PutObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
    ContentType: "image/jpeg",
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function getR2Object(key: string) {
  const client = getR2Client();
  const config = useRuntimeConfig();

  const command = new GetObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
  });

  const response = await client.send(command);
  return response.Body;
}

export async function deleteR2Object(key: string) {
  const client = getR2Client();
  const config = useRuntimeConfig();

  const command = new DeleteObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
  });

  await client.send(command);
}

export async function listR2Objects() {
  const client = getR2Client();
  const config = useRuntimeConfig();

  const command = new ListObjectsV2Command({
    Bucket: config.r2BucketName,
  });

  const response = await client.send(command);

  return (response.Contents || []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size || 0,
    lastModified: obj.LastModified || new Date(),
  }));
}
