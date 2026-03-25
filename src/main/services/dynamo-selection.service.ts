import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getDynamoClient } from './aws-config';

export interface Selection {
  selection_id: string;
  blocked: boolean;
  event_id: string;
  event_title: string;
  username: string;
}

export async function getBlockedSelections(): Promise<Selection[]> {
  const dynamo = getDynamoClient();

  const result = await dynamo.send(new ScanCommand({
    TableName: 'Selection',
    ConsistentRead: true,
    ScanFilter: {
      blocked: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{ BOOL: true }],
      },
    },
  }));

  if (!result.Items) return [];

  return result.Items.map((item) => {
    const raw = unmarshall(item);
    return {
      selection_id: String(raw['selectionId'] ?? ''),
      blocked: Boolean(raw['blocked']),
      event_id: String(raw['eventId'] ?? ''),
      event_title: String(raw['eventTitle'] ?? ''),
      username: String(raw['username'] ?? ''),
    };
  });
}

export async function getSelectedImageNames(selectionId: string): Promise<string[]> {
  const dynamo = getDynamoClient();

  const result = await dynamo.send(new ScanCommand({
    TableName: 'Selection',
    ConsistentRead: true,
    ScanFilter: {
      selectionId: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{ S: selectionId }],
      },
    },
  }));

  if (!result.Items || result.Items.length === 0) return [];

  const raw = unmarshall(result.Items[0]);
  const selectedImages = raw['selectedImages'];

  if (!Array.isArray(selectedImages)) return [];

  return selectedImages.map((v: unknown) => String(v));
}
