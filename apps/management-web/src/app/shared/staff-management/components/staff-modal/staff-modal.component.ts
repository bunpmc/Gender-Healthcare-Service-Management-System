import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Staff } from '../../../../models/staff.interface';
import { ModalConfig } from '../../models/staff-management.interface';
import { StaffManagementUtilsService } from '../../services/staff-management-utils.service';

@Component({
    selector: 'app-staff-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <!-- Modal Overlay -->
        <div 
            *ngIf="isOpen" 
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            (click)="onBackdropClick($event)">
            
            <!-- Modal Content -->
            <div 
                class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                (click)="$event.stopPropagation()">
                
                <!-- Modal Header -->
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">{{ modalTitle }}</h2>
                        <p class="text-sm text-gray-600">{{ modalSubtitle }}</p>
                    </div>
                    <button 
                        (click)="onClose()"
                        class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    
                    <!-- View Mode -->
                    <div *ngIf="config.mode === 'view'" class="space-y-6">
                        <div class="flex items-center space-x-4">
                            <div class="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                {{ utils.getInitials(staff?.full_name || '') }}
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">{{ staff?.full_name }}</h3>
                                <p class="text-gray-600">{{ staff?.working_email }}</p>
                                <p class="text-sm text-gray-500">ID: {{ staff?.staff_id }}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <span class="px-3 py-1 rounded-full text-sm font-medium" [class]="utils.getRoleBadgeClass(staff?.role || '')">
                                        {{ utils.getRoleName(staff?.role || '') }}
                                    </span>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span class="px-3 py-1 rounded-full text-sm font-medium" [class]="utils.getStatusBadgeClass(staff?.staff_status || '')">
                                        {{ staff?.staff_status | titlecase }}
                                    </span>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded-full mr-2" [class]="staff?.is_available ? 'bg-green-500' : 'bg-red-500'"></div>
                                        <span class="text-sm text-gray-900">{{ staff?.is_available ? "Available" : "Unavailable" }}</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                    <p class="text-gray-900">{{ staff?.years_experience || 0 }} years</p>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <p class="text-gray-900">{{ staff?.phone_number || staff?.phone || 'Not provided' }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <p class="text-gray-900">{{ staff?.address || 'Not provided' }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <p class="text-gray-900">{{ staff?.date_of_birth ? (staff?.date_of_birth | date:'mediumDate') : 'Not provided' }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <p class="text-gray-900">{{ (staff?.gender | titlecase) || 'Not provided' }}</p>
                                </div>
                            </div>
                        </div>

                        <div *ngIf="staff?.specialization">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <p class="text-gray-900">{{ staff?.specialization }}</p>
                        </div>

                        <div *ngIf="staff?.bio">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <p class="text-gray-900">{{ staff?.bio }}</p>
                        </div>

                        <div class="text-xs text-gray-500 pt-4 border-t">
                            <p>Created: {{ staff?.created_at ? (staff?.created_at | date:'medium') : 'Unknown' }}</p>
                            <p>Updated: {{ staff?.updated_at ? (staff?.updated_at | date:'medium') : 'Unknown' }}</p>
                        </div>
                    </div>

                    <!-- Edit/Create Mode -->
                    <form *ngIf="config.mode !== 'view'" [formGroup]="staffForm" (ngSubmit)="onSubmit()" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Left Column -->
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input 
                                        type="text" 
                                        formControlName="full_name"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter full name">
                                    <div *ngIf="staffForm.get('full_name')?.errors && staffForm.get('full_name')?.touched" class="text-red-500 text-xs mt-1">
                                        Full name is required
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Working Email *</label>
                                    <input 
                                        type="email" 
                                        formControlName="working_email"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter working email">
                                    <div *ngIf="staffForm.get('working_email')?.errors && staffForm.get('working_email')?.touched" class="text-red-500 text-xs mt-1">
                                        <span *ngIf="staffForm.get('working_email')?.errors?.['required']">Working email is required</span>
                                        <span *ngIf="staffForm.get('working_email')?.errors?.['email']">Please enter a valid email</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <select 
                                        formControlName="role"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="">Select a role</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="admin">Admin</option>
                                        <option value="technician">Technician</option>
                                    </select>
                                    <div *ngIf="staffForm.get('role')?.errors && staffForm.get('role')?.touched" class="text-red-500 text-xs mt-1">
                                        Role is required
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select 
                                        formControlName="staff_status"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="on_leave">On Leave</option>
                                        <option value="terminated">Terminated</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        formControlName="phone_number"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter phone number">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                    <input 
                                        type="number" 
                                        formControlName="years_experience"
                                        min="0"
                                        max="50"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter years of experience">
                                </div>
                            </div>

                            <!-- Right Column -->
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input 
                                        type="date" 
                                        formControlName="date_of_birth"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select 
                                        formControlName="gender"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea 
                                        formControlName="address"
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="Enter address"></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                    <input 
                                        type="text" 
                                        formControlName="specialization"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter specialization">
                                </div>

                                <div class="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="is_available"
                                        formControlName="is_available"
                                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                                    <label for="is_available" class="ml-2 block text-sm text-gray-900">Available for scheduling</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea 
                                formControlName="bio"
                                rows="4"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Enter bio/description"></textarea>
                        </div>
                    </form>
                </div>

                <!-- Modal Footer -->
                <div class="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button 
                        type="button"
                        (click)="onClose()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        {{ config.mode === 'view' ? 'Close' : 'Cancel' }}
                    </button>
                    
                    <button 
                        *ngIf="config.mode === 'view' && config.allowEdit"
                        (click)="onEdit()"
                        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
                        Edit Staff
                    </button>

                    <button 
                        *ngIf="config.mode !== 'view'"
                        type="submit"
                        (click)="onSubmit()"
                        [disabled]="staffForm.invalid || isSubmitting"
                        class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 border border-transparent rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        <span *ngIf="!isSubmitting">{{ config.mode === 'create' ? 'Create Staff' : 'Update Staff' }}</span>
                        <span *ngIf="isSubmitting" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    </button>
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
export class StaffModalComponent implements OnInit, OnDestroy {
    @Input() isOpen: boolean = false;
    @Input() staff: Staff | null = null;
    @Input() config: ModalConfig = {
        mode: 'view',
        allowEdit: true
    };

    @Output() close = new EventEmitter<void>();
    @Output() edit = new EventEmitter<void>();
    @Output() save = new EventEmitter<Partial<Staff>>();

    staffForm!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        public utils: StaffManagementUtilsService
    ) {}

    ngOnInit() {
        this.initializeForm();
        if (this.staff && this.config.mode !== 'view') {
            this.populateForm();
        }
    }

    ngOnDestroy() {
        // Clean up subscriptions if any
    }

    get modalTitle(): string {
        switch (this.config.mode) {
            case 'create': return 'Add New Staff Member';
            case 'edit': return 'Edit Staff Member';
            case 'view':
            default: return 'Staff Details';
        }
    }

    get modalSubtitle(): string {
        switch (this.config.mode) {
            case 'create': return 'Enter the details for the new staff member';
            case 'edit': return 'Update the staff member information';
            case 'view':
            default: return 'View staff member information';
        }
    }

    private initializeForm() {
        this.staffForm = this.fb.group({
            full_name: ['', [Validators.required]],
            working_email: ['', [Validators.required, Validators.email]],
            role: ['', [Validators.required]],
            staff_status: ['active'],
            phone_number: [''],
            years_experience: [0],
            date_of_birth: [''],
            gender: [''],
            address: [''],
            specialization: [''],
            bio: [''],
            is_available: [true]
        });
    }

    private populateForm() {
        if (this.staff) {
            this.staffForm.patchValue({
                full_name: this.staff.full_name,
                working_email: this.staff.working_email,
                role: this.staff.role,
                staff_status: this.staff.staff_status,
                phone_number: this.staff.phone_number || this.staff.phone,
                years_experience: this.staff.years_experience,
                date_of_birth: this.staff.date_of_birth ? new Date(this.staff.date_of_birth).toISOString().split('T')[0] : '',
                gender: this.staff.gender,
                address: this.staff.address,
                specialization: this.staff.specialization,
                bio: this.staff.bio,
                is_available: this.staff.is_available
            });
        }
    }

    onBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.onClose();
        }
    }

    onClose() {
        this.close.emit();
    }

    onEdit() {
        this.edit.emit();
    }

    onSubmit() {
        if (this.staffForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.staffForm.value;
            const staffData: Partial<Staff> = {
                ...formValue,
                date_of_birth: formValue.date_of_birth ? new Date(formValue.date_of_birth).toISOString() : null
            };

            // Include ID for edit mode
            if (this.config.mode === 'edit' && this.staff?.staff_id) {
                staffData.staff_id = this.staff.staff_id;
            }

            this.save.emit(staffData);
            
            // Reset submitting state after a delay (will be handled by parent)
            setTimeout(() => {
                this.isSubmitting = false;
            }, 1000);
        }
    }
}
