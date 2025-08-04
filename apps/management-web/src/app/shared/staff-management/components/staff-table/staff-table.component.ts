import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Staff } from '../../../../models/staff.interface';
import { StaffManagementConfig, StaffManagementEvents } from '../../models/staff-management.interface';
import { StaffManagementUtilsService } from '../../services/staff-management-utils.service';

@Component({
  selector: 'app-staff-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Loading State -->
    <div *ngIf="loading" class="flex justify-center items-center py-12">
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading && staff.length === 0" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
      <p class="text-gray-500 mb-4">Get started by adding your first staff member</p>
      <button 
        *ngIf="config.canCreate"
        (click)="onCreate()" 
        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium">
        <span class="flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Add First Staff Member</span>
        </span>
      </button>
    </div>

    <!-- Desktop Table -->
    <div *ngIf="!loading && staff.length > 0" class="hidden lg:block overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr *ngFor="let member of staff" class="hover:bg-gray-50 transition-colors">
            <!-- Staff Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img 
                      *ngIf="member.avatar_url || member.imageUrl" 
                      [src]="member.avatar_url || member.imageUrl" 
                      [alt]="member.full_name"
                      class="w-full h-full object-cover"
                      (error)="onImageError($event)"
                    />
                    <div *ngIf="!member.avatar_url && !member.imageUrl" 
                         class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      {{ utils.getInitials(member.full_name) }}
                    </div>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">{{ member.full_name }}</div>
                  <div class="text-sm text-gray-500">{{ member.working_email }}</div>
                  <div class="text-xs text-gray-400">ID: {{ member.staff_id }}</div>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span class="px-3 py-1 rounded-full text-xs font-medium" [class]="utils.getRoleBadgeClass(member.role)">
                {{ utils.getRoleName(member.role) }}
              </span>
            </td>

            <!-- Experience -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ member.years_experience || 0 }} years</td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-3 py-1 rounded-full text-sm font-medium" [class]="utils.getStatusBadgeClass(member.staff_status)">
                {{ member.staff_status | titlecase }}
              </span>
            </td>

            <!-- Availability -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" [class]="member.is_available ? 'bg-green-500' : 'bg-red-500'"></div>
                <span class="text-sm text-gray-900">{{ member.is_available ? "Available" : "Unavailable" }}</span>
              </div>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex items-center space-x-2">
                <!-- View Button -->
                <button 
                  (click)="onView(member)" 
                  class="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded" 
                  title="View Details">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>

                <!-- Edit Button -->
                <button 
                  *ngIf="config.canEdit"
                  (click)="onEdit(member)" 
                  class="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded" 
                  title="Edit Staff">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>

                <!-- Delete Button -->
                <button 
                  *ngIf="config.canDelete"
                  (click)="onDelete(member)" 
                  class="text-red-600 hover:text-red-900 transition-colors p-1 rounded" 
                  title="Delete Staff">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>

                <!-- Custom Actions -->
                <ng-container *ngFor="let action of config.customActions">
                  <button
                    *ngIf="!action.permission || action.permission(member)"
                    (click)="onCustomAction(action.id, member)"
                    [class]="'text-' + action.color + '-600 hover:text-' + action.color + '-900 transition-colors p-1 rounded'"
                    [title]="action.label">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.icon"></path>
                    </svg>
                  </button>
                </ng-container>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div *ngIf="!loading && staff.length > 0" class="lg:hidden">
      <div class="divide-y divide-gray-200">
        <div *ngFor="let member of staff" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img 
                    *ngIf="member.avatar_url || member.imageUrl" 
                    [src]="member.avatar_url || member.imageUrl" 
                    [alt]="member.full_name"
                    class="w-full h-full object-cover"
                    (error)="onImageError($event)"
                  />
                  <div *ngIf="!member.avatar_url && !member.imageUrl" 
                       class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {{ utils.getInitials(member.full_name) }}
                  </div>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ member.full_name }}</p>
                <p class="text-sm text-gray-500 truncate">{{ member.working_email }}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="utils.getRoleBadgeClass(member.role)">
                    {{ utils.getRoleName(member.role) }}
                  </span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="utils.getStatusBadgeClass(member.staff_status)">
                    {{ member.staff_status | titlecase }}
                  </span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="member.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ member.is_available ? "Available" : "Unavailable" }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ member.years_experience || 0 }} years experience</p>
              </div>
            </div>
            
            <!-- Mobile Actions -->
            <div class="flex items-center space-x-1 ml-2">
              <button (click)="onView(member)" class="text-indigo-600 hover:text-indigo-900 transition-colors p-2 rounded" title="View Details">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              
              <button 
                *ngIf="config.canEdit"
                (click)="onEdit(member)" 
                class="text-purple-600 hover:text-purple-900 transition-colors p-2 rounded" 
                title="Edit Staff">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>

              <button 
                *ngIf="config.canDelete"
                (click)="onDelete(member)" 
                class="text-red-600 hover:text-red-900 transition-colors p-2 rounded" 
                title="Delete Staff">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class StaffTableComponent {
  @Input() staff: Staff[] = [];
  @Input() loading: boolean = false;
  @Input() config: StaffManagementConfig = {
    portal: 'admin',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canTestEdgeFunction: true
  };

  @Output() viewStaff = new EventEmitter<Staff>();
  @Output() editStaff = new EventEmitter<Staff>();
  @Output() deleteStaff = new EventEmitter<Staff>();
  @Output() createStaff = new EventEmitter<void>();
  @Output() customAction = new EventEmitter<{ action: string; staff: Staff }>();

  constructor(public utils: StaffManagementUtilsService) { }

  onView(staff: Staff) {
    this.viewStaff.emit(staff);
  }

  onEdit(staff: Staff) {
    this.editStaff.emit(staff);
  }

  onDelete(staff: Staff) {
    this.deleteStaff.emit(staff);
  }

  onCreate() {
    this.createStaff.emit();
  }

  onCustomAction(action: string, staff: Staff) {
    this.customAction.emit({ action, staff });
  }

  /**
   * Handle image load error - fallback to placeholder
   */
  onImageError(event: any): void {
    const img = event.target;
    img.style.display = 'none';
    // The div with initials will show instead due to *ngIf logic
  }
}
