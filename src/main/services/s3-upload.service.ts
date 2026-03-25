import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from './aws-config';
import { getConfig } from '../config';

const PRESIGN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface S3UploadResult {
  objectKey: string;
  presignedUrl: string;
}

export async function uploadOriginalToS3(
  fileBuffer: Buffer,
  fileName: string,
  eventId: string,
  username: string
): Promise<S3UploadResult> {
  const { aws } = getConfig();
  const s3 = getS3Client();
  const objectKey = `${username}/${eventId}/images/original/${fileName}`;

  await s3.send(new PutObjectCommand({
    Bucket: aws.bucketName,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  }));

  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: aws.bucketName, Key: objectKey }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS }
  );

  return { objectKey, presignedUrl };
}

export async function uploadCompressedToS3(
  compressedBuffer: Buffer,
  compressedFileName: string,
  eventId: string,
  username: string
): Promise<S3UploadResult> {
  const { aws } = getConfig();
  const s3 = getS3Client();
  const objectKey = `${username}/${eventId}/images/compressed/${compressedFileName}`;

  await s3.send(new PutObjectCommand({
    Bucket: aws.bucketName,
    Key: objectKey,
    Body: compressedBuffer,
    ContentType: 'image/webp',
  }));

  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: aws.bucketName, Key: objectKey }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS }
  );

  return { objectKey, presignedUrl };
}
