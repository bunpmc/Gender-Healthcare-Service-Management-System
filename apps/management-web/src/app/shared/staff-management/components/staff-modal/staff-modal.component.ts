import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
                            <div class="h-20 w-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                <img 
                                    *ngIf="staff?.avatar_url || staff?.imageUrl" 
                                    [src]="staff?.avatar_url || staff?.imageUrl" 
                                    [alt]="staff?.full_name"
                                    class="w-full h-full object-cover"
                                    (error)="onImageError($event)"
                                />
                                <div *ngIf="!staff?.avatar_url && !staff?.imageUrl" 
                                     class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {{ utils.getInitials(staff?.full_name || '') }}
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">{{ staff?.full_name }}</h3>
                                <p class="text-gray-600">{{ staff?.working_email }}</p>
                                <p class="text-sm text-gray-500">Staff ID: {{ staff?.staff_id }}</p>
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

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <p class="text-gray-900">{{ (staff?.gender | titlecase) || 'Not provided' }}</p>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Hired Date</label>
                                    <p class="text-gray-900">{{ staff?.hired_at ? (staff?.hired_at | date:'mediumDate') : 'Not provided' }}</p>
                                </div>

                                <div *ngIf="staff && staff.languages && staff.languages.length > 0">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                                    <div class="flex flex-wrap gap-1">
                                        <span *ngFor="let language of staff.languages" 
                                              class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            {{ language }}
                                        </span>
                                    </div>
                                </div>

                                <div *ngIf="!staff?.languages || staff?.languages?.length === 0">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                                    <p class="text-gray-500">No languages specified</p>
                                </div>

                                <div *ngIf="staff?.image_link">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Profile Image Path</label>
                                    <p class="text-xs text-gray-500 break-all">{{ staff?.image_link }}</p>
                                </div>

                                <div *ngIf="!staff?.image_link">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Profile Image Path</label>
                                    <p class="text-gray-500">No image uploaded</p>
                                </div>
                            </div>
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
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                    <input 
                                        type="number" 
                                        formControlName="years_experience"
                                        min="0"
                                        max="50"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter years of experience">
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

                            <!-- Right Column -->
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Hired Date *</label>
                                    <input 
                                        type="date" 
                                        formControlName="hired_at"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                    <div *ngIf="staffForm.get('hired_at')?.errors && staffForm.get('hired_at')?.touched" class="text-red-500 text-xs mt-1">
                                        Hired date is required
                                    </div>
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
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Image Link</label>
                                    <input 
                                        type="text" 
                                        formControlName="image_link"
                                        [readonly]="config.mode === 'edit'"
                                        [class]="config.mode === 'edit' 
                                            ? 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500'
                                            : 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'"
                                        placeholder="Enter image path or URL">
                                    <p class="text-xs text-gray-500 mt-1">
                                        {{ config.mode === 'edit' ? 'Image link cannot be changed during edit' : 'Path to profile image in storage' }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                                    <input 
                                        type="text" 
                                        formControlName="languages_input"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter languages separated by commas">
                                    <p class="text-xs text-gray-500 mt-1">Separate multiple languages with commas (e.g., English, Vietnamese, French)</p>
                                </div>
                            </div>
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
export class StaffModalComponent implements OnInit, OnDestroy, OnChanges {
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
    ) { }

    ngOnInit() {
        this.initializeForm();
        if (this.staff && this.config.mode !== 'view') {
            this.populateForm();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // When config mode changes to edit, populate the form
        if (changes['config'] && this.staffForm && this.config.mode === 'edit' && this.staff) {
            this.populateForm();
        }

        // When staff data changes, populate the form if in edit mode
        if (changes['staff'] && this.staffForm && this.config.mode !== 'view' && this.staff) {
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
            years_experience: [0],
            hired_at: ['', [Validators.required]],
            gender: [''],
            image_link: [''],
            languages_input: [''], // For comma-separated input
            is_available: [true]
        });
    }

    private populateForm() {
        if (this.staff) {
            // Convert languages array to comma-separated string for editing
            const languagesString = this.staff.languages ? this.staff.languages.join(', ') : '';

            this.staffForm.patchValue({
                full_name: this.staff.full_name,
                working_email: this.staff.working_email,
                role: this.staff.role,
                staff_status: this.staff.staff_status,
                years_experience: this.staff.years_experience,
                hired_at: this.staff.hired_at ? new Date(this.staff.hired_at).toISOString().split('T')[0] : '',
                gender: this.staff.gender,
                image_link: this.staff.image_link,
                languages_input: languagesString,
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

            // Process languages input: convert comma-separated string to array
            const languagesArray = formValue.languages_input
                ? formValue.languages_input.split(',').map((lang: string) => lang.trim()).filter((lang: string) => lang)
                : [];

            const staffData: Partial<Staff> = {
                full_name: formValue.full_name,
                working_email: formValue.working_email,
                role: formValue.role,
                staff_status: formValue.staff_status,
                years_experience: formValue.years_experience || 0,
                hired_at: formValue.hired_at,
                gender: formValue.gender || null,
                image_link: formValue.image_link || null,
                languages: languagesArray.length > 0 ? languagesArray : null,
                is_available: formValue.is_available
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
    }    /**
     * Handle image load error - fallback to placeholder
     */
    onImageError(event: any): void {
        const img = event.target;
        img.style.display = 'none';
        // The div with initials will show instead due to *ngIf logic
    }
}
