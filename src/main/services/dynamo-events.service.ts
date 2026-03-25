import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getDynamoClient } from './aws-config';

export interface Event {
  event_id: string;
  date: string;
  username: string;
  title: string;
}

export async function getAllEvents(): Promise<Event[]> {
  const dynamo = getDynamoClient();

  const result = await dynamo.send(new ScanCommand({
    TableName: 'Events',
    ConsistentRead: true,
  }));

  if (!result.Items) return [];

  return result.Items.map((item) => {
    const raw = unmarshall(item);
    return {
      event_id: String(raw['eventId'] ?? ''),
      date: String(raw['date'] ?? ''),
      username: String(raw['username'] ?? ''),
      title: String(raw['title'] ?? ''),
    };
  });
}
