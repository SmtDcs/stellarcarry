export const STATUS = {
  RELEASED: "released",
  DELIVERED: "delivered",
  REFUNDED: "refunded",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export interface ReputationHistoryItem {
  id: string;
  description: string;
  amountStroops: number;
  status: Status;
  createdAt: string;
  counterparty: string;
}

export interface ReputationData {
  address: string;
  score: number;
  completedDeliveries: number;
  history: ReputationHistoryItem[];
}
