// kpi-card.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../supabase.service';
// Temporarily commented out until dependencies are properly installed
// import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule], // NgChartsModule temporarily removed
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
})
export class KpiCardComponent implements OnInit {
  appointments = 0;
  newPatients = 0;
  revenue = 0;
  taskCompletion = 0;

  appointmentsChange = 0;
  newPatientsChange = 0;
  revenueChange = 0;
  taskCompletionChange = 0;

  miniChartOptions = {
    responsive: true,
    elements: {
      line: { borderWidth: 2, tension: 0.4 },
      point: { radius: 0 }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  appointmentsChartData = [{ data: [10, 12, 14, 13, 15, 17, 16], borderColor: '#2563eb', fill: false }];
  appointmentsChartLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  newPatientsChartData = [{ data: [5, 7, 6, 8, 9, 10, 11], borderColor: '#16a34a', fill: false }];
  newPatientsChartLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  revenueChartData = [{ data: [100, 120, 110, 130, 140, 150, 160], borderColor: '#ca8a04', fill: false }];
  revenueChartLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  taskCompletionChartData = [{ data: [80, 85, 90, 88, 92, 95, 97], borderColor: '#a21caf', fill: false }];
  taskCompletionChartLabels = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const end = new Date();

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    this.appointments = await this.supabaseService.getAppointmentsCount(startISO, endISO);
    this.newPatients = await this.supabaseService.getNewPatientsCount(startISO, endISO);
    this.revenue = await this.supabaseService.getRevenueSum(startISO, endISO);
    this.taskCompletion = await this.supabaseService.getTaskCompletionRatio(startISO, endISO);
    // ...tính toán các biến change nếu cần...
  }
}
