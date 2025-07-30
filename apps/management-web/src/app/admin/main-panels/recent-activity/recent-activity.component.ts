import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../supabase.service';

interface Activity {
  type: 'info' | 'success' | 'error';
  iconPath: string;
  title: string;
  description: string;
  iconHover: boolean;
}

interface Notification {
  notification_type: string;
  appointment?: { patient?: { full_name?: string } };
  sent_at: string;
  [key: string]: any;
}

@Component({
  selector: 'app-recent-activity',
  imports: [CommonModule],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.css'
})
export class RecentActivityComponent implements OnInit {
  activities: Activity[] = [];
  isLoading = true;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadRecentNotifications();
  }

  async loadRecentNotifications() {
    this.isLoading = true;
    try {
      const recentActivities = await this.supabaseService.getRecentActivities();
      this.activities = recentActivities.map((activity: any) => ({
        type: this.getActivityTypeFromActivity(activity.type),
        iconPath: this.getIconPathFromActivity(activity.type),
        title: this.getTitleFromActivity(activity),
        description: this.getDescriptionFromActivity(activity),
        iconHover: false
      }));
    } catch (error) {
      console.error('Error loading recent activities:', error);
      this.activities = [{
        type: 'error',
        iconPath: 'M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
        title: 'Error',
        description: 'Failed to load recent activities',
        iconHover: false
      }];
    } finally {
      this.isLoading = false;
    }
  }

  private getActivityType(type: string): 'info' | 'success' | 'error' {
    switch (type) {
      case 'new_appointment':
        return 'info';
      default:
        return 'error';
    }
  }

  private getIconPath(type: string): string {
    switch (type) {
      case 'new_appointment':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z';
    }
  }

  private getTitle(notification: Notification): string {
    switch (notification.notification_type) {
      case 'new_appointment':
        return 'New appointment booked';
      default:
        return 'Unknown notification';
    }
  }

  private getDescription(notification: Notification): string {
    if (notification.notification_type === 'new_appointment') {
      const patientName = notification.appointment?.patient?.full_name || 'Unknown Patient';
      const timeAgo = this.getTimeAgo(notification.sent_at);
      return `${patientName} - ${timeAgo}`;
    }
    return 'No description available';
  }

  private getTimeAgo(sentAt: string): string {
    const now = new Date();
    const sent = new Date(sentAt);
    const diffMs = now.getTime() - sent.getTime();
    const diffMins = Math.round(diffMs / 60000); // Convert to minutes

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }

  // New methods for handling activity data
  private getActivityTypeFromActivity(type: string): 'info' | 'success' | 'error' {
    switch (type) {
      case 'appointment':
        return 'info';
      case 'patient':
        return 'success';
      default:
        return 'info';
    }
  }

  private getIconPathFromActivity(type: string): string {
    switch (type) {
      case 'appointment':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'patient':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  private getTitleFromActivity(activity: any): string {
    switch (activity.type) {
      case 'appointment':
        return 'New Appointment';
      case 'patient':
        return 'New Patient';
      default:
        return 'Activity';
    }
  }

  private getDescriptionFromActivity(activity: any): string {
    const timeAgo = this.getTimeAgo(activity.timestamp);
    return `${activity.description} - ${timeAgo}`;
  }
}
