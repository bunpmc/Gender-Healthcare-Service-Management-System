import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RecentActivityComponent } from './recent-activity/recent-activity.component';
import { TodayScheduleComponent } from './today-schedule/today-schedule.component';

@Component({
  selector: 'app-main-panels',
  standalone: true,
  imports: [CommonModule, RecentActivityComponent, TodayScheduleComponent],
  templateUrl: './main-panels.component.html',
  styleUrl: './main-panels.component.css'
})
export class MainPanelsComponent {

}
