import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

// Interfaces
export interface Stat {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

export interface User {
  _id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  password?: string;
  confirmPassword?: string;
  username: string;
  role: string;
  department: string;
  joiningDate: string;
  address?: string;
  image?: string;
  profileImage?: string | null;
  status?: string;
}

export interface Permissions {
  dashboard: boolean;
  viewUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  roles: boolean;
  addUser: boolean;
  viewActivityLog: boolean;
}

export interface Role {
  _id?: string;
  name: string;
  description: string;
  permissions: Permissions;
}

export interface ActivityLog {
  _id: string;
  user: string;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})

export class DataService {
  // API Configuration
  public readonly api = 'http://localhost:3000/api';
  private apiEndpoints = {
    users: '/users',
    stats: '/stats',
    roles: '/roles',
    activities: '/activities'
  };

  // --- Constants ---
  readonly TABLE_COLUMNS : string[] = [
    'select', 'fullName', 'username', 'email', 'department', 
    'role', 'status', 'joiningDate', 'actions'
  ];

  readonly PATTERNS = {
    NAME: /^[A-Za-z\s.\-']+$/,
    PHONE: /^\d{10}$/,
    USERNAME: /^[a-zA-Z0-9._]+$/
  };

  // --- Global Application State ---
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  setError(message: string): void {
    this.errorSubject.next(message);
    this.showNotification(message, 'error');
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  // --- Subjects ---
  private dashboardStatsSubject = new BehaviorSubject<Stat[]>([
    { label: 'Total Users', value: '0', change: '0%', icon: 'users', color: '#6366f1' },
    { label: 'Active Now', value: '0', change: '0%', icon: 'circle', color: '#10b981' },
    { label: 'Roles', value: '0', change: '—', icon: 'star', color: '#f59e0b' },
    { label: 'Departments', value: '0', change: '—', icon: 'building', color: '#ec4899' }
  ]);

  private usersSubject = new BehaviorSubject<User[]>([]);

  private rolesSubject = new BehaviorSubject<Role[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  private departmentsSubject = new BehaviorSubject<string[]>(['Engineering', 'HR', 'Finance', 'Sales']);

  private userPermissionsSubject = new BehaviorSubject<Permissions | null>(null);
  public userPermissions$ = this.userPermissionsSubject.asObservable();

  setUserPermissions(permissions: Permissions): void {
    this.userPermissionsSubject.next(permissions);
  }

  get userPermissionsSubjectValue(): Permissions | null {
    return this.userPermissionsSubject.value;
  }

  dashboardStats$ = this.dashboardStatsSubject.asObservable();
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    // Load permissions from localStorage if available
    const savedPermissions = localStorage.getItem('permissions');
    if (savedPermissions) {
      this.userPermissionsSubject.next(JSON.parse(savedPermissions));
    }
  }

  // --- Notifications ---
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  // --- Error Handling ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // --- Data Logic ---
  refreshUsers(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<{success: boolean, data: User[]}>(`${this.api}${this.apiEndpoints.users}`).pipe(
      catchError(err => {
        const msg = err.message || 'Failed to fetch users';
        this.errorSubject.next(msg);
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (response) => {
        if (response?.success) {
          this.usersSubject.next(response.data);
          this.calculateStats(response.data);
        }
      }
    });
  }

  getUser(userId: string): Observable<{success: boolean, data: User}> {
    this.loadingSubject.next(true);
    return this.http.get<{success: boolean, data: User}>(`${this.api}${this.apiEndpoints.users}/${userId}`).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  private calculateStats(users: User[]): void {
    const total = users.length;
    const active = users.filter(u => u.status?.toLowerCase() === 'active').length;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    
    const stats = this.dashboardStatsSubject.value.map(stat => {
      if (stat.label === 'Total Users') return { ...stat, value: total.toString() };
      if (stat.label === 'Active Now') return { ...stat, value: active.toString(), change: `${activePct}%` };
      if (stat.label === 'Roles') return { ...stat, value: this.rolesSubject.value.length.toString() };
      if (stat.label === 'Departments') return { ...stat, value: this.departmentsSubject.value.length.toString() };
      return stat;
    });
    this.dashboardStatsSubject.next(stats);
  }

  // --- CRUD Operations ---
  addUser(user: User): Observable<any> {
    this.loadingSubject.next(true);
    return this.http.post<any>(`${this.api}${this.apiEndpoints.users}`, user).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('User registered successfully!', 'success');
          this.refreshUsers();
        }
      }),
      catchError(err => {
        const msg = err.error?.message || 'Failed to register user.';
        this.showNotification(msg, 'error');
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  deleteUser(userId: string): Observable<any> {
    this.loadingSubject.next(true);
    return this.http.delete<any>(`${this.api}${this.apiEndpoints.users}/${userId}`).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('User deleted successfully.', 'success');
          this.refreshUsers();
        }
      }),
      catchError(err => {
        this.showNotification('Failed to delete user.', 'error');
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  deleteMultipleUsers(userIds: string[]): Observable<any> {
    this.loadingSubject.next(true);
    return this.http.delete<any>(`${this.api}${this.apiEndpoints.users}/delete-multiple`, {
      body: { ids: userIds }
    }).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification(`${res.deletedCount} users deleted successfully.`, 'success');
          this.refreshUsers();
        }
      }),
      catchError(err => {
        this.showNotification('Failed to delete multiple users.', 'error');
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  updateUser(userId: string, user: User): Observable<any> {
    this.loadingSubject.next(true);
    return this.http.put<any>(`${this.api}${this.apiEndpoints.users}/${userId}`, user).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('User updated successfully.', 'success');
          this.refreshUsers();
        }
      }),
      catchError(err => {
        const msg = err.error?.message || 'Failed to update user.';
        this.showNotification(msg, 'error');
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // --- Role Management ---
  getRoles(): Observable<Role[]> {
    this.refreshRoles();
    return this.roles$;
  }

  refreshRoles(): void {
    this.loadingSubject.next(true);
    this.http.get<{success: boolean, data: Role[]}>(`${this.api}${this.apiEndpoints.roles}`).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (response) => {
        if (response?.success) {
          this.rolesSubject.next(response.data);
          this.calculateStats(this.usersSubject.value);
        }
      }
    });
  }

  addRole(role: Role): Observable<any> {
    return this.http.post<any>(`${this.api}${this.apiEndpoints.roles}`, role).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('Role created successfully!', 'success');
          this.refreshRoles();
        }
      }),
      catchError(err => this.handleError(err))
    );
  }

  updateRole(roleId: string, role: Role): Observable<any> {
    return this.http.put<any>(`${this.api}${this.apiEndpoints.roles}/${roleId}`, role).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('Role updated successfully.', 'success');
          this.refreshRoles();
        }
      }),
      catchError(err => this.handleError(err))
    );
  }

  deleteRole(roleId: string): Observable<any> {
    return this.http.delete<any>(`${this.api}${this.apiEndpoints.roles}/${roleId}`).pipe(
      tap(res => {
        if (res.success) {
          this.showNotification('Role deleted successfully.', 'success');
          this.refreshRoles();
        }
      }),
      catchError(err => this.handleError(err))
    );
  }

  fetchUserPermissions(roleName: string): void {
    this.http.get<{success: boolean, data: Role}>(`${this.api}${this.apiEndpoints.roles}/name/${roleName}`).subscribe({
      next: (res) => {
        if(res.success) {
          this.userPermissionsSubject.next(res.data.permissions);
          localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
        }
      }
    });
  }

  clearUserPermissions(): void {
    this.userPermissionsSubject.next(null);
  }

  // Activity Log
  getActivities(): Observable<{success: boolean, data: ActivityLog[]}> {
    return this.http.get<{success: boolean, data: ActivityLog[]}>(`${this.api}${this.apiEndpoints.activities}`);
  }

  // --- Helpers ---
  getDepartments(): string[] { return this.departmentsSubject.value; }

  getTodayDate(): string { return new Date().toISOString().split('T')[0]; }

  // --- Static Validators ---
  static nameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const pattern = /^[A-Za-z\s.\-']+$/;
    return !value || pattern.test(value) ? null : { lettersAndSpaces: true };
  }

  static noSpacesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    return value.includes(' ') ? { containsSpaces: true } : null;
  }

  static joiningDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const dateParts = control.value.split('-');
    if (dateParts.length !== 3) return { invalidDate: true };
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    
    const selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 200);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }
    
    if (selectedDate < minDate || year < 1800) {
      return { tooOld: true };
    }

    return null;
  }

  static passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }
}
