export interface Notification {
  notification_id: string;
  appointment_id?: string;
  staff_id?: string;
  notification_type: NotificationType;
  sent_at?: string;
  // Additional fields for display
  title?: string;
  message?: string;
  is_read?: boolean;
}

export interface GuestNotification {
  notification_id: string;
  appointment_id?: string;
  staff_id?: string;
  notification_type: NotificationType;
  sent_at?: string;
}

export enum NotificationType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PATIENT_MESSAGE = 'patient_message',
  SYSTEM_ALERT = 'system_alert',
  BLOG_PUBLISHED = 'blog_published'
}

export interface CreateNotificationRequest {
  appointment_id?: string;
  staff_id?: string;
  notification_type: NotificationType;
  title?: string;
  message?: string;
}
