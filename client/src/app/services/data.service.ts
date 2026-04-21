import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, finalize } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

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
  id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  password?: string;
  confirmPassword?: string;
  role: string;
  department: string;
  joiningDate: string;
  address?: string;
  image?: string;
  profileImage?: string | null;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})

export class DataService {
  // API Configuration
  public readonly api = environment.apiUrl;
  private apiEndpoints = {
    users: '/users',
    stats: '/stats'
  };

  // --- Constants ---
  readonly ROLES : string[] = ['Admin', 'HR', 'Employee'];
  readonly DEPARTMENTS : string[] = ['Engineering', 'HR', 'Finance', 'Sales'];
  readonly STATUSES : string[] = ['Active', 'Inactive'];
  
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

  // --- Subjects ---
  tot_role_count : number = this.ROLES.length 
  tot_dept_count : number = this.DEPARTMENTS.length
  private dashboardStatsSubject = new BehaviorSubject<Stat[]>([
    { label: 'Total Users', value: '0', change: '0%', icon: 'users', color: '#6366f1' },
    { label: 'Active Now', value: '0', change: '0%', icon: 'circle', color: '#10b981' },
    { label: 'Roles', value: this.tot_role_count.toString(), change: '—', icon: 'star', color: '#f59e0b' },
    { label: 'Departments', value: this.tot_dept_count.toString(), change: '—', icon: 'building', color: '#ec4899' }
  ]);

  private usersSubject = new BehaviorSubject<User[]>([]);

  dashboardStats$ = this.dashboardStatsSubject.asObservable();
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

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
  getDashboardStats(): Observable<Stat[]> {
    this.refreshUsers();
    return this.dashboardStats$;
  }

  getUsers(): Observable<User[]> {
    this.refreshUsers();
    return this.users$;
  }

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

  private calculateStats(users: User[]): void {
    const total = users.length;
    const active = users.filter(u => u.status?.toLowerCase() === 'active').length;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
    
    const stats = this.dashboardStatsSubject.value.map(stat => {
      if (stat.label === 'Total Users') return { ...stat, value: total.toString() };
      if (stat.label === 'Active Now') return { ...stat, value: active.toString(), change: `${activePct}%` };
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
        this.showNotification('Failed to register user.', 'error');
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
        this.showNotification('Failed to update user.', 'error');
        return this.handleError(err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // --- Helpers ---
  getRoles(): string[] { return this.ROLES; }
  getDepartments(): string[] { return this.DEPARTMENTS; }
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

  static futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const [year, month, day] = control.value.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? { futureDate: true } : null;
  }

  static passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }
}
