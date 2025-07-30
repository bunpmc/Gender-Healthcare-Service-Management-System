import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarDay,
  PeriodEntry,
  PeriodStats,
} from '../../models/period-tracking.model';

@Component({
  selector: 'app-period-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="period-calendar">
      <!-- Calendar Header -->
      <div class="flex items-center justify-between mb-4">
        <button
          (click)="previousMonth()"
          class="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            class="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>

        <h3 class="text-lg font-bold text-gray-800">
          {{ monthYearDisplay() }}
        </h3>

        <button
          (click)="nextMonth()"
          class="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            class="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-0.5 mb-3">
        <!-- Day Headers -->
        @for (day of dayHeaders; track day) {
        <div class="text-center text-xs font-medium text-gray-500 py-0.5">
          {{ day }}
        </div>
        }

        <!-- Calendar Days -->
        @for (day of calendarDays(); track day.dateString) {
        <div
          class="relative aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-all duration-200 cursor-pointer"
          [ngClass]="getDayClasses(day)"
          (click)="onDayClick(day)"
        >
          <span class="relative z-10">{{ day.dayNumber }}</span>

          <!-- Period Day Dot -->
          @if (day.isPeriodDay) {
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          </div>
          }

          <!-- Fertile Day Dot -->
          @if (day.isFertileDay && !day.isPeriodDay) {
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          </div>
          }

          <!-- Ovulation Day Dot -->
          @if (day.isOvulationDay && !day.isPeriodDay) {
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div class="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
          </div>
          }

          <!-- Predicted Period Dot -->
          @if (day.isPredictedPeriod && !day.isPeriodDay) {
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div class="w-1.5 h-1.5 rounded-full bg-pink-400 opacity-70"></div>
          </div>
          }

          <!-- Late Period Indicator -->
          @if (day.isLatePeriod) {
          <div class="absolute top-0.5 left-1/2 transform -translate-x-1/2">
            <div class="text-xs font-bold text-red-600">
              {{ day.daysLate }}d
            </div>
          </div>
          }

          <!-- Today Indicator Ring -->
          @if (day.isToday) {
          <div
            class="absolute inset-0 rounded-lg border-2 border-blue-400 pointer-events-none"
          ></div>
          }
        </div>
        }
      </div>

      <!-- Legend -->
      <div
        class="grid grid-cols-2 md:grid-cols-5 gap-2 p-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg"
      >
        <div class="flex items-center space-x-1">
          <div
            class="relative w-3 h-3 bg-white border border-red-500 rounded-sm"
          >
            <div
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500"
            ></div>
          </div>
          <span class="text-xs text-gray-600">Period</span>
        </div>
        <div class="flex items-center space-x-1">
          <div
            class="relative w-3 h-3 bg-white border border-emerald-500 rounded-sm"
          >
            <div
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"
            ></div>
          </div>
          <span class="text-xs text-gray-600">Peak Fertility</span>
        </div>
        <div class="flex items-center space-x-1">
          <div
            class="relative w-3 h-3 bg-white border border-yellow-500 rounded-sm"
          >
            <div
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-yellow-500"
            ></div>
          </div>
          <span class="text-xs text-gray-600">Ovulation</span>
        </div>
        <div class="flex items-center space-x-1">
          <div
            class="relative w-3 h-3 bg-white border border-orange-400 rounded-sm"
          >
            <div
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
            ></div>
          </div>
          <span class="text-xs text-gray-600">Best Conception</span>
        </div>
        <div class="flex items-center space-x-1">
          <div
            class="relative w-3 h-3 bg-white border border-pink-400 border-dashed rounded-sm"
          >
            <div
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pink-400 opacity-70"
            ></div>
          </div>
          <span class="text-xs text-gray-600">Predicted</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .period-calendar {
        @apply w-full max-w-sm mx-auto;
      }

      .aspect-square {
        aspect-ratio: 1;
        min-height: 22px;
        max-height: 26px;
      }

      @media (max-width: 640px) {
        .aspect-square {
          min-height: 20px;
          max-height: 24px;
        }
      }
    `,
  ],
})
export class PeriodCalendarComponent implements OnInit {
  @Input() periodHistory: PeriodEntry[] = [];
  @Input() periodStats: PeriodStats | null = null;
  @Input() miniMode: boolean = false;
  @Input() currentMonth = signal(new Date());
  @Output() daySelected = new EventEmitter<CalendarDay>();
  @Output() monthChanged = new EventEmitter<Date>();

  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarDays = signal<CalendarDay[]>([]);

  monthYearDisplay = computed(() => {
    return this.currentMonth().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  ngOnInit() {
    this.generateCalendar();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  // New method to get dynamic CSS classes for each day
  getDayClasses(day: CalendarDay): string {
    const classes: string[] = [];

    // Base styling
    if (!day.isCurrentMonth) {
      classes.push('text-gray-400', 'bg-gray-50');
    } else {
      // Period day gets highest priority
      if (day.isPeriodDay) {
        classes.push(
          'bg-white',
          'text-red-600',
          'border-2',
          'border-red-500',
          'shadow-sm',
          'hover:bg-red-50'
        );
      }
      // Late period indicator
      else if (day.isLatePeriod) {
        classes.push(
          'bg-white',
          'text-red-700',
          'border-2',
          'border-red-400',
          'border-dashed',
          'animate-pulse',
          'shadow-sm',
          'hover:bg-red-50'
        );
      }
      // Peak fertility (only if not period day)
      else if (day.isPeakFertility) {
        classes.push(
          'bg-white',
          'text-emerald-600',
          'border-2',
          'border-emerald-500',
          'shadow-sm',
          'hover:bg-emerald-50'
        );
      }
      // Ovulation day (only if not period day)
      else if (day.isOvulationDay) {
        classes.push(
          'bg-white',
          'text-yellow-700',
          'border-2',
          'border-yellow-500',
          'shadow-sm',
          'hover:bg-yellow-50'
        );
      }
      // Optimal conception (only if not period/ovulation day)
      else if (day.isOptimalConception) {
        classes.push(
          'bg-white',
          'text-orange-600',
          'border-2',
          'border-orange-400',
          'shadow-sm',
          'hover:bg-orange-50'
        );
      }
      // Regular fertile day (only if not any of the above)
      else if (day.isFertileDay) {
        classes.push(
          'bg-white',
          'text-green-600',
          'border-2',
          'border-green-400',
          'shadow-sm',
          'hover:bg-green-50'
        );
      }
      // Predicted period (only if not any of the above)
      else if (day.isPredictedPeriod) {
        classes.push(
          'bg-white',
          'text-pink-600',
          'border-2',
          'border-pink-400',
          'border-dashed',
          'shadow-sm',
          'hover:bg-pink-50'
        );
      }
      // Regular day
      else {
        classes.push(
          'text-gray-700',
          'bg-white',
          'border',
          'border-gray-200',
          'hover:bg-gray-50',
          'hover:border-gray-300'
        );
      }

      // Special styling for today (overlay effect)
      if (day.isToday) {
        classes.push('ring-2', 'ring-blue-400', 'ring-inset', 'font-bold');
      }
    }

    return classes.join(' ');
  }

  previousMonth(): void {
    const current = this.currentMonth();
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentMonth.set(previous);
    this.monthChanged.emit(previous);
    this.generateCalendar();
  }

  nextMonth(): void {
    const current = this.currentMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentMonth.set(next);
    this.monthChanged.emit(next);
    this.generateCalendar();
  }

  onDayClick(day: CalendarDay): void {
    if (day.isCurrentMonth) {
      this.daySelected.emit(day);
    }
  }

  private generateCalendar(): void {
    const days: CalendarDay[] = [];
    const current = this.currentMonth();
    const year = current.getFullYear();
    const month = current.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const day: CalendarDay = {
        date: new Date(currentDate),
        dateString: this.formatDateString(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isDateToday(currentDate),
        isPeriodDay: this.isPeriodDay(currentDate),
        isFertileDay: this.isFertileDay(currentDate),
        isOvulationDay: this.isOvulationDay(currentDate),
        isPredictedPeriod: this.isPredictedPeriod(currentDate),
        dayNumber: currentDate.getDate(),
        status: this.getDayStatus(currentDate),
        // Enhanced fertility indicators
        fertilityLevel: this.getFertilityLevel(currentDate),
        cyclePhase: this.getCyclePhase(currentDate),
        conceptionChance: this.getConceptionChance(currentDate),
        isOptimalConception: this.isOptimalConceptionDay(currentDate),
        isPeakFertility: this.isPeakFertilityDay(currentDate),
        isLatePeriod: this.isLatePeriodDay(currentDate),
        daysLate: this.getDaysLate(currentDate),
      };

      days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.calendarDays.set(days);
  }

  private isDateToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private formatDateString(date: Date): string {
    // Format date as YYYY-MM-DD without timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isOngoingPeriodDay(date: Date): boolean {
    // Check if this date is part of an ongoing period (no cycle_length)
    return this.periodHistory.some((entry) => {
      if (entry.cycle_length) return false; // Has cycle_length, not ongoing

      const startDate = new Date(entry.start_date + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return date >= startDate && date <= today;
    });
  }

  // ========== ENHANCED FERTILITY ANALYSIS METHODS ==========

  getFertilityLevel(date: Date): 'none' | 'low' | 'moderate' | 'high' | 'peak' {
    if (!this.periodStats) return 'none';

    const dateString = this.formatDateString(date);
    const ovulationDate = this.periodStats.ovulationDate;
    const fertileStart = this.periodStats.fertileWindowStart;
    const fertileEnd = this.periodStats.fertileWindowEnd;

    if (dateString === ovulationDate) return 'peak';
    if (this.isDateInRange(dateString, fertileStart, fertileEnd)) {
      const ovulationDay = new Date(ovulationDate);
      const daysDiff = Math.abs(
        (date.getTime() - ovulationDay.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) return 'peak';
      if (daysDiff <= 2) return 'high';
      if (daysDiff <= 3) return 'moderate';
      return 'low';
    }

    return 'none';
  }

  getCyclePhase(
    date: Date
  ): 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' {
    if (!this.periodStats) return 'follicular';

    const dateString = this.formatDateString(date);

    // Check if it's a period day
    if (this.isPeriodDay(date)) return 'menstrual';

    // Check if it's around ovulation (±1 day)
    const ovulationDate = new Date(this.periodStats.ovulationDate);
    const daysDiff = Math.abs(
      (date.getTime() - ovulationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) return 'ovulatory';

    // Check if it's before or after ovulation
    if (date < ovulationDate) return 'follicular';
    return 'luteal';
  }

  getConceptionChance(date: Date): number {
    const fertilityLevel = this.getFertilityLevel(date);

    switch (fertilityLevel) {
      case 'peak':
        return 95;
      case 'high':
        return 75;
      case 'moderate':
        return 50;
      case 'low':
        return 25;
      default:
        return 5;
    }
  }

  isOptimalConceptionDay(date: Date): boolean {
    if (!this.periodStats?.conceptionTiming?.optimalWindow) return false;

    const dateString = this.formatDateString(date);
    return (
      this.periodStats.conceptionTiming.optimalWindow.start <= dateString &&
      dateString <= this.periodStats.conceptionTiming.optimalWindow.end
    );
  }

  isPeakFertilityDay(date: Date): boolean {
    return this.getFertilityLevel(date) === 'peak';
  }

  isLatePeriodDay(date: Date): boolean {
    if (!this.periodStats?.periodStatus) return false;

    const dateString = this.formatDateString(date);
    const expectedDate = this.periodStats.periodStatus.expectedDate;
    const today = new Date().toISOString().split('T')[0];

    return (
      this.periodStats.periodStatus.isLate &&
      dateString === today &&
      dateString > expectedDate
    );
  }

  getDaysLate(date: Date): number | undefined {
    if (!this.isLatePeriodDay(date)) return undefined;
    return this.periodStats?.periodStatus?.daysLate;
  }

  private isDateInRange(
    date: string,
    startDate: string,
    endDate: string
  ): boolean {
    return date >= startDate && date <= endDate;
  }

  private isPeriodDay(date: Date): boolean {
    const dateString = this.formatDateString(date);

    return this.periodHistory.some((entry) => {
      const startDate = new Date(entry.start_date + 'T00:00:00');
      const startDateString = this.formatDateString(startDate);

      // If no cycle_length, it's an ongoing period - check if date is >= start date and <= today
      if (!entry.cycle_length) {
        const today = new Date();
        const todayString = this.formatDateString(today);
        return dateString >= startDateString && dateString <= todayString;
      }

      // If has cycle_length, calculate period duration using period_length or default 5 days
      const periodDuration = entry.period_length || 5;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + periodDuration - 1);
      const endDateString = this.formatDateString(endDate);

      return dateString >= startDateString && dateString <= endDateString;
    });
  }

  private isFertileDay(date: Date): boolean {
    // Use period stats if available for more accurate fertile window
    if (this.periodStats) {
      const fertileStart = new Date(this.periodStats.fertileWindowStart);
      const fertileEnd = new Date(this.periodStats.fertileWindowEnd);
      return date >= fertileStart && date <= fertileEnd;
    }

    // Fallback: Simple fertile window calculation (days 10-17 of cycle)
    return this.periodHistory.some((entry) => {
      const startDate = new Date(entry.start_date);
      const fertileStart = new Date(startDate);
      fertileStart.setDate(startDate.getDate() + 9); // Day 10
      const fertileEnd = new Date(startDate);
      fertileEnd.setDate(startDate.getDate() + 16); // Day 17
      return date >= fertileStart && date <= fertileEnd;
    });
  }

  private isOvulationDay(date: Date): boolean {
    // Use period stats if available for more accurate ovulation date
    if (this.periodStats) {
      const ovulationDate = new Date(this.periodStats.ovulationDate);
      return date.toDateString() === ovulationDate.toDateString();
    }

    // Fallback: Ovulation typically occurs around day 14
    return this.periodHistory.some((entry) => {
      const startDate = new Date(entry.start_date);
      const ovulationDate = new Date(startDate);
      ovulationDate.setDate(startDate.getDate() + 13); // Day 14
      return date.toDateString() === ovulationDate.toDateString();
    });
  }

  private isPredictedPeriod(date: Date): boolean {
    if (this.periodHistory.length === 0) return false;

    // Use period stats if available for more accurate prediction
    if (this.periodStats) {
      const predictedStart = new Date(this.periodStats.nextPeriodDate);
      // Predicted period duration (5 days default)
      const predictedEnd = new Date(predictedStart);
      predictedEnd.setDate(
        predictedStart.getDate() + (this.periodStats.averagePeriodLength - 1)
      );

      return date >= predictedStart && date <= predictedEnd;
    }

    // Fallback: Predict next period based on average cycle length
    const lastPeriod = this.periodHistory[0];
    const averageCycle = 28; // Default cycle length
    const lastStart = new Date(lastPeriod.start_date);
    const predictedStart = new Date(lastStart);
    predictedStart.setDate(lastStart.getDate() + averageCycle);

    // Predicted period duration (5 days)
    const predictedEnd = new Date(predictedStart);
    predictedEnd.setDate(predictedStart.getDate() + 4);

    return date >= predictedStart && date <= predictedEnd;
  }

  private getDayStatus(
    date: Date
  ): 'period' | 'fertile' | 'ovulation' | 'predicted' | 'normal' {
    if (this.isPeriodDay(date)) return 'period';
    if (this.isOvulationDay(date)) return 'ovulation';
    if (this.isFertileDay(date)) return 'fertile';
    if (this.isPredictedPeriod(date)) return 'predicted';
    return 'normal';
  }
}
