import type { ReputationData } from "@/lib/types";

export type { ReputationHistoryItem, ReputationData } from "@/lib/types";

export const MOCK_REPUTATION: ReputationData = {
  address: "GDM7JQ2BL3A6S4K7MGZQMH2YMFSJHZSN5TPDP3DQOXHSOWYM43EFJXK2",
  score: 87,
  completedDeliveries: 12,
  history: [
    {
      id: "esc-001",
      description: "iPhone 15 Pro — TR to DE",
      amountStroops: 75_000_000,
      status: "released",
      createdAt: "2026-06-20T10:30:00Z",
      counterparty: "GC5KLTY...QT6M",
    },
    {
      id: "esc-002",
      description: "Vintage watch — US to JP",
      amountStroops: 120_000_000,
      status: "delivered",
      createdAt: "2026-06-15T08:15:00Z",
      counterparty: "GAP4MNB...RK8L",
    },
    {
      id: "esc-003",
      description: "Designer handbag — FR to GB",
      amountStroops: 45_000_000,
      status: "released",
      createdAt: "2026-06-10T14:00:00Z",
      counterparty: "GBX7WDC...FN3P",
    },
    {
      id: "esc-004",
      description: "Sneakers — KR to US",
      amountStroops: 30_000_000,
      status: "refunded",
      createdAt: "2026-05-28T09:45:00Z",
      counterparty: "GDN9HVT...LJ2K",
    },
    {
      id: "esc-005",
      description: "Camera lens — TR to DE",
      amountStroops: 55_000_000,
      status: "released",
      createdAt: "2026-05-20T16:20:00Z",
      counterparty: "GAE3QRS...MP7Y",
    },
  ],
};
