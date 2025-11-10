import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;

export function getR2Client() {
  if (r2Client) return r2Client;

  const config = useRuntimeConfig();

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

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return uploadUrl;
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
