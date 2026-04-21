// src/app/dashboard/dashboard.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faCircle, faStar, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { DataService, Stat, User } from '../../services/data.service';
import { Observable } from 'rxjs';

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('roleChart') roleChartCanvas!: ElementRef;
  @ViewChild('deptChart') deptChartCanvas!: ElementRef;

  stats$!: Observable<Stat[]>;
  users$!: Observable<User[]>;
  
  private roleChart: Chart | undefined;
  private deptChart: Chart | undefined;
  currentUser: any;



  // Font Awesome icons mapping
  private iconMap: { [key: string]: IconDefinition } = {
    'users': faUsers,
    'circle': faCircle,
    'star': faStar,
    'building': faBuilding
  };

  constructor(
    public dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
    this.stats$ = this.dataService.dashboardStats$;
    this.users$ = this.dataService.users$;

    // Refresh users on load
    this.dataService.refreshUsers();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }


  ngAfterViewInit(): void {
    this.users$.subscribe(users => {
      if (users && users.length > 0) {
        this.createCharts(users);
        this.cdr.detectChanges();
      }
    });
  }


  createCharts(users: User[]): void {
    // 1. Process Roles Data
    const roles: { [key: string]: number } = {};
    users.forEach(user => {
      roles[user.role] = (roles[user.role] || 0) + 1;
    });

    // 2. Process Departments Data
    const depts: { [key: string]: number } = {};
    users.forEach(user => {
      depts[user.department] = (depts[user.department] || 0) + 1;
    });

    this.renderRoleChart(Object.keys(roles), Object.values(roles));
    this.renderDeptChart(Object.keys(depts), Object.values(depts));
  }

  renderRoleChart(labels: string[], data: number[]): void {
    if (this.roleChart) this.roleChart.destroy();
    
    this.roleChart = new Chart(this.roleChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#1f2937',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderDeptChart(labels: string[], data: number[]): void {
    if (this.deptChart) this.deptChart.destroy();

    this.deptChart = new Chart(this.deptChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Employees',
          data: data,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 8,
          hoverBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { family: 'Inter' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter' } }
          }
        }
      }
    });
  }

  getIcon(iconName: string): IconDefinition {
    return this.iconMap[iconName] || faUsers;
  }
}