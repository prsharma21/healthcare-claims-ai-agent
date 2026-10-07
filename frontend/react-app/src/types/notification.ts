export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  tone: NotificationTone;
  claimId: string | null;
}
