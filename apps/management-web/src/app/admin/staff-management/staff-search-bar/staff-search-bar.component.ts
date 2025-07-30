import { Role } from '../../../models/staff.interface';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'app-staff-search-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-search-bar.component.html',
  styleUrls: ['./staff-search-bar.component.css'],
  standalone: true
})
export class StaffSearchBarComponent implements OnInit, OnDestroy {
  @Input() roles: Role[] = [];
  @Output() filterChange = new EventEmitter<{
    searchTerm: string;
    selectedRole: string;
    selectedStatus: string;
    selectedAvailability: string;
  }>();
  @Output() addStaff = new EventEmitter<void>();
  @Output() exportData = new EventEmitter<void>();

  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  selectedAvailability = '';
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.emitFilters());
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  onFilter() {
    this.emitFilters();
  }

  onAddStaff() {
    this.addStaff.emit();
  }

  onExportData() {
    this.exportData.emit();
  }

  clearSearch() {
    this.searchTerm = '';
    this.emitFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedAvailability = '';
    this.emitFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedRole || this.selectedStatus || this.selectedAvailability);
  }

  private emitFilters() {
    this.filterChange.emit({
      searchTerm: this.searchTerm,
      selectedRole: this.selectedRole,
      selectedStatus: this.selectedStatus,
      selectedAvailability: this.selectedAvailability
    });
  }
}
