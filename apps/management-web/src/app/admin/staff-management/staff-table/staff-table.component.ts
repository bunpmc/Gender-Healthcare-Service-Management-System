import { Role, Staff } from './../../../models/staff.interface';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-table.component.html',
  styleUrls: ['./staff-table.component.css'],
  standalone: true
})
export class StaffTableComponent {
  @Input() filteredStaff: Staff[] = [];
  @Input() roles: Role[] = [];
  @Input() page: number = 1;
  @Input() pageSize: number = 10;
  @Output() viewStaff = new EventEmitter<Staff>();
  @Output() editStaff = new EventEmitter<Staff>();
  @Output() deleteStaff = new EventEmitter<Staff>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  get paginatedStaff(): Staff[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredStaff.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pageSize);
  }

  getRoleName(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  onViewStaff(staff: Staff) {
    this.viewStaff.emit(staff);
  }

  onEditStaff(staff: Staff) {
    this.editStaff.emit(staff);
  }

  onDeleteStaff(staff: Staff) {
    this.deleteStaff.emit(staff);
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.pageChange.emit({ page: newPage, pageSize: this.pageSize });
    }
  }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  }

  /**
   * Get initials from full name for avatar fallback
   */
  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
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
