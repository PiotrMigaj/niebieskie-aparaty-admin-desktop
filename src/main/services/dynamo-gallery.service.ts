import { PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getDynamoClient } from './aws-config';
import type { UploadedData } from './upload-store';

export async function saveGalleryItem(data: UploadedData): Promise<void> {
  const dynamo = getDynamoClient();

  const item = {
    fileName: data.fileName,
    compressedFileName: data.compressedFileName,
    eventId: data.eventId,
    username: data.username,
    originalFileObjectKey: data.originalFileObjectKey,
    originalFilePresignedUrl: data.originalFilePresignedUrl,
    compressedFileObjectKey: data.compressedFileObjectKey,
    compressedFilePresignedUrl: data.compressedFilePresignedUrl,
    compressedFileWidth: data.compressedFileWidth,
    compressedFileHeight: data.compressedFileHeight,
    presignDateTime: data.presignDateTime,
  };

  await dynamo.send(new PutItemCommand({
    TableName: 'GalleriesCamel',
    Item: marshall(item),
  }));
}

export async function updateEventWithCamelGallery(eventId: string): Promise<void> {
  const dynamo = getDynamoClient();

  await dynamo.send(new UpdateItemCommand({
    TableName: 'Events',
    Key: marshall({ eventId }),
    UpdateExpression: 'SET camelGallery = :val',
    ExpressionAttributeValues: marshall({ ':val': true }),
  }));
}
