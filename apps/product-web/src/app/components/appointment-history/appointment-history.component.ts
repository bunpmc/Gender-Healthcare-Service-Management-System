import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { DoctorNamePipe } from '../../utils/name.util';

@Component({
  selector: 'app-appointment-history',
  standalone: true,
  imports: [CommonModule, DoctorNamePipe],
  template: `
    <div class="appointment-history-container">
      <div class="header mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          📅 Appointment History
        </h2>
        <p class="text-gray-600">
          View and manage your appointment history
        </p>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">Loading appointments...</span>
        </div>
      }

      <!-- No Appointments -->
      @if (!loading && appointments.length === 0) {
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📅</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">
            No Appointments Yet
          </h3>
          <p class="text-gray-500 mb-6">
            You haven't booked any appointments yet.
          </p>
          <button 
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            (click)="bookNewAppointment()"
          >
            Book Your First Appointment
          </button>
        </div>
      }

      <!-- Appointments List -->
      @if (!loading && appointments.length > 0) {
        <div class="space-y-4">
          @for (appointment of appointments; track appointment.appointment_id) {
            <div class="appointment-card bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <!-- Header -->
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-4">
                  @if (appointment.doctors?.image_link) {
                    <img 
                      [src]="appointment.doctors.image_link" 
                      [alt]="appointment.doctors.full_name"
                      class="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  } @else {
                    <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-blue-600 font-semibold text-lg">
                        {{ appointment.doctors?.full_name?.charAt(0) || 'D' }}
                      </span>
                    </div>
                  }
                  
                  <div>
                    <h3 class="font-semibold text-gray-800">
                      {{ appointment.doctors?.full_name | doctorName }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {{ appointment.doctors?.specialization || 'General Practice' }}
                    </p>
                  </div>
                </div>
                
                <span 
                  class="px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="getStatusClass(appointment.status)"
                >
                  {{ getStatusText(appointment.status) }}
                </span>
              </div>

              <!-- Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p class="text-sm text-gray-600 mb-1">📅 Preferred Date</p>
                  <p class="font-medium">
                    {{ formatDate(appointment.preferred_date) || 'Not specified' }}
                  </p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-600 mb-1">🕐 Preferred Time</p>
                  <p class="font-medium">
                    {{ appointment.preferred_time || 'Not specified' }}
                  </p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-600 mb-1">🏥 Visit Type</p>
                  <p class="font-medium capitalize">
                    {{ appointment.visit_type || 'Consultation' }}
                  </p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-600 mb-1">📞 Contact</p>
                  <p class="font-medium">
                    {{ appointment.phone }}
                  </p>
                </div>
              </div>

              <!-- Message -->
              @if (appointment.message) {
                <div class="mb-4">
                  <p class="text-sm text-gray-600 mb-1">💬 Message</p>
                  <p class="text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {{ appointment.message }}
                  </p>
                </div>
              }

              <!-- Actions -->
              <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                <p class="text-sm text-gray-500">
                  Created: {{ formatDate(appointment.created_at) }}
                </p>
                
                <div class="flex space-x-2">
                  <button 
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    (click)="viewDetails(appointment)"
                  >
                    View Details
                  </button>
                  
                  @if (appointment.status === 'pending') {
                    <button 
                      class="text-red-600 hover:text-red-800 text-sm font-medium"
                      (click)="cancelAppointment(appointment)"
                    >
                      Cancel
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .appointment-history-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .appointment-card {
      transition: all 0.3s ease;
    }
    
    .appointment-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class AppointmentHistoryComponent implements OnInit {
  appointments: any[] = [];
  loading = true;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadAppointmentHistory();
  }

  loadAppointmentHistory() {
    this.loading = true;

    this.appointmentService.getUserAppointmentHistory().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
        console.log('✅ Appointment history loaded:', appointments.length);
      },
      error: (error) => {
        console.error('❌ Error loading appointment history:', error);
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '⏳ Pending';
      case 'confirmed':
        return '✅ Confirmed';
      case 'completed':
        return '🎉 Completed';
      case 'cancelled':
        return '❌ Cancelled';
      default:
        return '❓ Unknown';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  viewDetails(appointment: any) {
    console.log('👁️ Viewing appointment details:', appointment);
    // TODO: Navigate to appointment details page or open modal
  }

  cancelAppointment(appointment: any) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.updateAppointmentStatus(
        appointment.appointment_id,
        'cancelled'
      ).subscribe({
        next: (updatedAppointment) => {
          console.log('✅ Appointment cancelled:', updatedAppointment);
          // Update local state
          const index = this.appointments.findIndex(
            a => a.appointment_id === appointment.appointment_id
          );
          if (index !== -1) {
            this.appointments[index].status = 'cancelled';
          }
        },
        error: (error) => {
          console.error('❌ Error cancelling appointment:', error);
          alert('Failed to cancel appointment. Please try again.');
        }
      });
    }
  }

  bookNewAppointment() {
    // TODO: Navigate to appointment booking page
    console.log('📅 Navigating to book new appointment');
  }
}
