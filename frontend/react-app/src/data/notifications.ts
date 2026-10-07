import type { AppNotification } from "@/types/notification";
import { minutesAgo } from "@/utils/date";

export function getNotificationData(): AppNotification[] {
  return [
    {
      id: "NTF-001",
      title: "Fraud review required",
      description: "CLM10007 matches previously paid claim CLM09001.",
      createdAt: minutesAgo(12),
      tone: "danger",
      claimId: "CLM10007",
    },
    {
      id: "NTF-002",
      title: "Information requested",
      description: "CLM10004 is missing a prior authorization number.",
      createdAt: minutesAgo(48),
      tone: "warning",
      claimId: "CLM10004",
    },
    {
      id: "NTF-003",
      title: "Claim approved",
      description: "CLM10001 was approved with 94% confidence.",
      createdAt: minutesAgo(65),
      tone: "success",
      claimId: "CLM10001",
    },
  ];
}
