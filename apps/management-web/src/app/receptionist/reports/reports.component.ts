import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReportMetric {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p class="text-gray-600">Performance metrics and insights for reception operations</p>
          </div>
          <div class="flex items-center space-x-3">
            <select
              [(ngModel)]="selectedPeriod"
              (change)="loadReportData()"
              class="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="relative">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>

      <!-- Reports Content -->
      <div *ngIf="!loading">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            *ngFor="let metric of keyMetrics"
            class="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <div class="w-3 h-3 rounded-full" [style.background-color]="metric.color"></div>
                  <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide">{{ metric.title }}</h3>
                </div>
                <p class="text-3xl font-bold text-gray-900 mb-1">{{ metric.value }}</p>
                <div class="flex items-center space-x-1">
                  <svg
                    *ngIf="metric.changeType === 'increase'"
                    class="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7"></path>
                  </svg>
                  <svg
                    *ngIf="metric.changeType === 'decrease'"
                    class="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10"></path>
                  </svg>
                  <span
                    class="text-sm font-medium"
                    [ngClass]="metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'">
                    {{ metric.change }}%
                  </span>
                  <span class="text-sm text-gray-500">vs last period</span>
                </div>
              </div>
              <div class="flex-shrink-0">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  [style.background]="'linear-gradient(135deg, ' + metric.color + ', ' + metric.color + '80)'">
                  <div [innerHTML]="metric.icon" class="text-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Appointment Status Chart -->
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Appointment Status</h3>
                <p class="text-sm text-gray-500">Distribution of appointment statuses</p>
              </div>
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
            
            <!-- Simple Bar Chart -->
            <div class="space-y-4">
              <div *ngFor="let item of appointmentStatusData" class="flex items-center">
                <div class="w-20 text-sm font-medium text-gray-700">{{ item.label }}</div>
                <div class="flex-1 mx-4">
                  <div class="bg-gray-200 rounded-full h-3">
                    <div
                      class="h-3 rounded-full transition-all duration-500"
                      [style.width.%]="(item.value / getMaxValue(appointmentStatusData)) * 100"
                      [style.background-color]="item.color">
                    </div>
                  </div>
                </div>
                <div class="w-12 text-sm font-bold text-gray-900 text-right">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- Daily Activity Chart -->
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Daily Activity</h3>
                <p class="text-sm text-gray-500">Reception tasks completed per day</p>
              </div>
              <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
            
            <!-- Simple Line Chart -->
            <div class="space-y-4">
              <div *ngFor="let item of dailyActivityData" class="flex items-center">
                <div class="w-16 text-sm font-medium text-gray-700">{{ item.label }}</div>
                <div class="flex-1 mx-4">
                  <div class="bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      [style.width.%]="(item.value / getMaxValue(dailyActivityData)) * 100"
                      [style.background-color]="item.color">
                    </div>
                  </div>
                </div>
                <div class="w-12 text-sm font-bold text-gray-900 text-right">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Summary -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Performance Summary</h3>
              <p class="text-sm text-gray-500">Key insights and recommendations</p>
            </div>
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Efficiency Score -->
            <div class="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl font-bold text-white">{{ efficiencyScore }}%</span>
              </div>
              <h4 class="font-bold text-gray-900 mb-1">Efficiency Score</h4>
              <p class="text-sm text-gray-600">Overall reception performance</p>
            </div>

            <!-- Patient Satisfaction -->
            <div class="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl font-bold text-white">{{ patientSatisfaction }}%</span>
              </div>
              <h4 class="font-bold text-gray-900 mb-1">Patient Satisfaction</h4>
              <p class="text-sm text-gray-600">Based on feedback surveys</p>
            </div>

            <!-- Response Time -->
            <div class="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-xl font-bold text-white">{{ avgResponseTime }}m</span>
              </div>
              <h4 class="font-bold text-gray-900 mb-1">Avg Response Time</h4>
              <p class="text-sm text-gray-600">Patient inquiry response</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern Reports Styles */
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Card hover effects */
    .hover\\:shadow-2xl:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    /* Hover scale effect */
    .hover\\:scale-105:hover {
      transform: scale(1.05);
    }

    /* Chart animations */
    .transition-all {
      transition: all 0.5s ease-in-out;
    }
  `]
})
export class ReportsComponent implements OnInit {
  loading = true;
  selectedPeriod = 'month';

  keyMetrics: ReportMetric[] = [];
  appointmentStatusData: ChartData[] = [];
  dailyActivityData: ChartData[] = [];

  efficiencyScore = 92;
  patientSatisfaction = 88;
  avgResponseTime = 3;

  constructor() {}

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.loading = true;

    // Simulate API call
    setTimeout(() => {
      this.keyMetrics = [
        {
          title: 'Total Appointments',
          value: 156,
          change: 12,
          changeType: 'increase',
          color: '#4f46e5',
          icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                 </svg>`
        },
        {
          title: 'Check-ins Completed',
          value: 142,
          change: 8,
          changeType: 'increase',
          color: '#059669',
          icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                 </svg>`
        },
        {
          title: 'New Registrations',
          value: 23,
          change: 15,
          changeType: 'increase',
          color: '#7c3aed',
          icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                 </svg>`
        },
        {
          title: 'Cancellations',
          value: 8,
          change: 3,
          changeType: 'decrease',
          color: '#dc2626',
          icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                 </svg>`
        }
      ];

      this.appointmentStatusData = [
        { label: 'Confirmed', value: 89, color: '#059669' },
        { label: 'Pending', value: 34, color: '#d97706' },
        { label: 'Completed', value: 142, color: '#4f46e5' },
        { label: 'Cancelled', value: 8, color: '#dc2626' }
      ];

      this.dailyActivityData = [
        { label: 'Mon', value: 45, color: '#4f46e5' },
        { label: 'Tue', value: 52, color: '#4f46e5' },
        { label: 'Wed', value: 38, color: '#4f46e5' },
        { label: 'Thu', value: 61, color: '#4f46e5' },
        { label: 'Fri', value: 48, color: '#4f46e5' },
        { label: 'Sat', value: 29, color: '#4f46e5' },
        { label: 'Sun', value: 15, color: '#4f46e5' }
      ];

      this.loading = false;
    }, 1000);
  }

  getMaxValue(data: ChartData[]): number {
    return Math.max(...data.map(item => item.value));
  }
}
