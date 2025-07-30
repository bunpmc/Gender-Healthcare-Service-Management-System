import { Category } from './../../../models/category.interface';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface ServiceFilters {
  searchTerm: string;
  selectedCategory: string;
  selectedStatus: string;
}

@Component({
  selector: 'app-service-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-search-bar.component.html',
  styleUrls: ['./service-search-bar.component.css']
})
export class ServiceSearchBarComponent implements OnInit, OnDestroy {
  @Input() categories: Category[] = [];
  @Input() totalResults: number = 0;
  @Output() filterChange = new EventEmitter<ServiceFilters>();
  @Output() addService = new EventEmitter<void>();
  @Output() addCategory = new EventEmitter<void>();
  @Output() exportData = new EventEmitter<void>();

  // Search and filter properties
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  showAdvancedFilters = false;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  applyFilters() {
    this.filterChange.emit({
      searchTerm: this.searchQuery.trim(),
      selectedCategory: this.selectedCategory,
      selectedStatus: this.selectedStatus
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onAddService() {
    this.addService.emit();
  }

  onAddCategory() {
    this.addCategory.emit();
  }

  onExportData() {
    this.exportData.emit();
  }

  // Utility methods
  hasActiveFilters(): boolean {
    return !!(this.searchQuery.trim() || this.selectedCategory || this.selectedStatus);
  }
}
