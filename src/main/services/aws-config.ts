import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getConfig } from '../config';

let _s3Client: S3Client | null = null;
let _dynamoClient: DynamoDBClient | null = null;

export function getS3Client(): S3Client {
  if (!_s3Client) {
    const { aws } = getConfig();
    _s3Client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKey,
        secretAccessKey: aws.secretKey,
      },
    });
  }
  return _s3Client;
}

export function getDynamoClient(): DynamoDBClient {
  if (!_dynamoClient) {
    const { aws } = getConfig();
    _dynamoClient = new DynamoDBClient({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKey,
        secretAccessKey: aws.secretKey,
      },
    });
  }
  return _dynamoClient;
}
