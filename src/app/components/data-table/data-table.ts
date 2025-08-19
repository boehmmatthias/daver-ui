import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface SortState {
  column: string;
  direction: 'asc' | 'desc' | null;
}

@Component({
  selector: 'daver-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable {
  @Input() set data(value: any[]) {
    this.rawData.set(value || []);
    this.updateTableData();
  }

  rawData = signal<any[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);
  displayedColumns = signal<string[]>([]);
  paginatedData = signal<any[]>([]);
  sortState = signal<SortState>({ column: '', direction: null });
  totalItems = computed(() => this.rawData().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  updateTableData() {
    const data = this.rawData();
    if (data.length === 0) {
      this.displayedColumns.set([]);
      this.paginatedData.set([]);
      return;
    }

    // Extract column names from the first row
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    this.displayedColumns.set(columns);

    // Apply sorting and pagination
    this.applySortingAndPagination();
  }

  applySortingAndPagination() {
    let sortedData = [...this.rawData()];
    
    // Apply sorting if active
    const sort = this.sortState();
    if (sort.column && sort.direction) {
      sortedData.sort((a, b) => {
        const aValue = a[sort.column];
        const bValue = b[sort.column];
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return sort.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sort.direction === 'asc' ? 1 : -1;
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return sort.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }
        
        // Handle date strings
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sort.direction === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        }
        
        // Default string comparison
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        return sort.direction === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
      });
    }

    // Apply pagination
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    const paginated = sortedData.slice(startIndex, endIndex);
    this.paginatedData.set(paginated);
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.applySortingAndPagination();
  }

  onSort(column: string) {
    const currentSort = this.sortState();
    
    if (currentSort.column === column) {
      // Cycle through: asc -> desc -> null
      if (currentSort.direction === 'asc') {
        this.sortState.set({ column, direction: 'desc' });
      } else if (currentSort.direction === 'desc') {
        this.sortState.set({ column, direction: null });
      } else {
        this.sortState.set({ column, direction: 'asc' });
      }
    } else {
      // New column, start with ascending
      this.sortState.set({ column, direction: 'asc' });
    }
    
    // Reset to first page when sorting
    this.currentPage.set(0);
    this.applySortingAndPagination();
  }

  getSortIcon(column: string): string {
    const sort = this.sortState();
    if (sort.column !== column) return 'unfold_more';
    if (sort.direction === 'asc') return 'expand_less';
    if (sort.direction === 'desc') return 'expand_more';
    return 'unfold_more';
  }

  getColumnType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      // Check if it's a date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) return 'date';
      return 'string';
    }
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toLocaleDateString();
      return value;
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
} 