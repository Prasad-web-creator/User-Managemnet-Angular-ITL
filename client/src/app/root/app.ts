import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartLine, faUserPlus, faUsers, faSignOutAlt, faBars, faTimes, faShieldAlt, faHistory, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { DataService, Permissions } from '../services/data.service';
import { Observable } from 'rxjs';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { filter } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private router = inject(Router);
  public dataService = inject(DataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  title = 'user-management-app';
  dashboardIcon = faChartLine;
  addUserIcon = faUserPlus;
  usersIcon = faUsers;
  rolesIcon = faShieldAlt;
  activityLogIcon = faHistory;
  logoutIcon = faSignOutAlt;
  menuIcon = faBars;
  closeIcon = faTimes;
  errorIcon = faExclamationTriangle;
  showSidebar = true;
  permissions$: Observable<Permissions | null> = this.dataService.userPermissions$;
  isMobileMenuOpen = false;

  get currentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
  get isAdmin() {
    return this.currentUser?.role === 'Admin';
  }

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showSidebar = !event.urlAfterRedirects.includes('/login') && !event.urlAfterRedirects.includes('/forgot-password');
      
      // Fetch permissions if logged in
      if (this.currentUser) {
          this.dataService.fetchUserPermissions(this.currentUser.role);
      }
    });

    // Handle initial load permissions
    if (this.currentUser) {
        this.dataService.fetchUserPermissions(this.currentUser.role);
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    this.dataService.clearUserPermissions();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  viewProfile() {
    if (!this.currentUser) return;
    this.router.navigate(['/profile', this.currentUser._id]);
  }
}
