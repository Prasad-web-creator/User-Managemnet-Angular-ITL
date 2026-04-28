import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { DataService, ActivityLog } from '../../services/data.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatChipsModule, FontAwesomeModule],
  templateUrl: './activity-log.html',
  styleUrl: './activity-log.scss'
})
export class ActivityLogComponent implements OnInit {
  faHistory = faHistory;
  activities: ActivityLog[] = [];
  displayedColumns: string[] = ['timestamp', 'username', 'action', 'target', 'details'];
  isLoading = true;

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(): void {
    this.isLoading = true;
    this.dataService.getActivities().subscribe({
      next: (res) => {
        if (res.success) {
          this.activities = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'Login': return 'primary';
      case 'Create User':
      case 'Create Role': return 'success';
      case 'Edit User':
      case 'Edit Role': return 'accent';
      case 'Delete User':
      case 'Delete Multiple Users':
      case 'Delete Role': return 'warn';
      default: return '';
    }
  }
}
