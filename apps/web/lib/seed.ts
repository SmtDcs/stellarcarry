import type { Request, Traveler } from "@stellarcarry/core";

/** Deterministic sample data so screens render without a live chain. */
export const seedRequests: Request[] = [
  { id: "r1", buyer: "GBUYER1", fromCountry: "TR", toCountry: "DE", itemWeightG: 500, rewardStroops: 50_000_000, deadlineDay: 100 },
  { id: "r2", buyer: "GBUYER2", fromCountry: "US", toCountry: "JP", itemWeightG: 1200, rewardStroops: 120_000_000, deadlineDay: 60 },
  { id: "r3", buyer: "GBUYER3", fromCountry: "FR", toCountry: "GB", itemWeightG: 300, rewardStroops: 30_000_000, deadlineDay: 45 },
  { id: "r4", buyer: "GBUYER4", fromCountry: "KR", toCountry: "US", itemWeightG: 800, rewardStroops: 75_000_000, deadlineDay: 80 },
  // r5 is intentionally unserved (no traveler runs DE→KR) so the "no matching
  // travelers" empty state stays reachable and testable.
  { id: "r5", buyer: "GBUYER5", fromCountry: "DE", toCountry: "KR", itemWeightG: 400, rewardStroops: 40_000_000, deadlineDay: 70 },
];

export const seedTravelers: Traveler[] = [
  // ── TR→DE (request r1: ≥500g, by day 100) ──
  { id: "t1", account: "GTRAV1", fromCountry: "TR", toCountry: "DE", travelDay: 50, capacityG: 1000, reputation: 80 },
  { id: "t2", account: "GTRAV2", fromCountry: "TR", toCountry: "DE", travelDay: 60, capacityG: 600, reputation: 92 },
  { id: "t3", account: "GTRAV3", fromCountry: "TR", toCountry: "DE", travelDay: 30, capacityG: 1500, reputation: 95 },
  { id: "t4", account: "GTRAV4", fromCountry: "TR", toCountry: "DE", travelDay: 90, capacityG: 500, reputation: 70 },
  { id: "t5", account: "GTRAV5", fromCountry: "TR", toCountry: "DE", travelDay: 40, capacityG: 300, reputation: 88 }, // under capacity (won't match r1)
  { id: "t22", account: "GTRAV22", fromCountry: "TR", toCountry: "DE", travelDay: 70, capacityG: 900, reputation: 90 },

  // ── US→JP (request r2: ≥1200g, by day 60) ──
  { id: "t6", account: "GTRAV6", fromCountry: "US", toCountry: "JP", travelDay: 40, capacityG: 2000, reputation: 90 },
  { id: "t7", account: "GTRAV7", fromCountry: "US", toCountry: "JP", travelDay: 55, capacityG: 1500, reputation: 84 },
  { id: "t8", account: "GTRAV8", fromCountry: "US", toCountry: "JP", travelDay: 20, capacityG: 1300, reputation: 76 },
  { id: "t9", account: "GTRAV9", fromCountry: "US", toCountry: "JP", travelDay: 50, capacityG: 1000, reputation: 99 }, // under capacity (won't match r2)

  // ── FR→GB (request r3: ≥300g, by day 45) ──
  { id: "t10", account: "GTRAV10", fromCountry: "FR", toCountry: "GB", travelDay: 20, capacityG: 800, reputation: 85 },
  { id: "t11", account: "GTRAV11", fromCountry: "FR", toCountry: "GB", travelDay: 35, capacityG: 500, reputation: 91 },
  { id: "t12", account: "GTRAV12", fromCountry: "FR", toCountry: "GB", travelDay: 10, capacityG: 350, reputation: 78 },
  { id: "t13", account: "GTRAV13", fromCountry: "FR", toCountry: "GB", travelDay: 44, capacityG: 300, reputation: 70 },
  { id: "t23", account: "GTRAV23", fromCountry: "FR", toCountry: "GB", travelDay: 25, capacityG: 1200, reputation: 96 },

  // ── KR→US (request r4: ≥800g, by day 80) ──
  { id: "t14", account: "GTRAV14", fromCountry: "KR", toCountry: "US", travelDay: 60, capacityG: 1200, reputation: 88 },
  { id: "t15", account: "GTRAV15", fromCountry: "KR", toCountry: "US", travelDay: 30, capacityG: 900, reputation: 95 },
  { id: "t16", account: "GTRAV16", fromCountry: "KR", toCountry: "US", travelDay: 75, capacityG: 800, reputation: 82 },
  { id: "t17", account: "GTRAV17", fromCountry: "KR", toCountry: "US", travelDay: 90, capacityG: 1000, reputation: 99 }, // too late (won't match r4)
  { id: "t24", account: "GTRAV24", fromCountry: "KR", toCountry: "US", travelDay: 40, capacityG: 850, reputation: 91 },

  // ── Other routes (directory variety; match no current request) ──
  { id: "t18", account: "GTRAV18", fromCountry: "JP", toCountry: "KR", travelDay: 25, capacityG: 1100, reputation: 80 },
  { id: "t19", account: "GTRAV19", fromCountry: "GB", toCountry: "FR", travelDay: 33, capacityG: 600, reputation: 73 },
  { id: "t20", account: "GTRAV20", fromCountry: "US", toCountry: "GB", travelDay: 48, capacityG: 1400, reputation: 89 },
  { id: "t21", account: "GTRAV21", fromCountry: "DE", toCountry: "TR", travelDay: 52, capacityG: 700, reputation: 66 },
];
