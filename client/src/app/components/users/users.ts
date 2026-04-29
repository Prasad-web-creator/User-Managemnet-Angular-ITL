import { Component, OnInit, ChangeDetectorRef, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService, User } from '../../services/data.service';
import { Router } from '@angular/router';

import { ConfirmDialogComponent } from '../shared/confirm-dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSelectModule,
  ],

  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit, OnDestroy {
  public dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = [];
  selection = new SelectionModel<User>(true, []);
  currentSort = '';
  currentUser: any;
  permissions$ = this.dataService.userPermissions$;

  roles: string[] = [];
  departments: string[] = [];
  filterValues = {
    search: '',
    role: '',
    department: '',
    status: ''
  };

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.dataSource.paginator = mp;
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.dataSource.sort = ms;
    this.sort = ms;
  }

  // To keep compatibility with existing methods
  sort!: MatSort;

  constructor() { }

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    this.currentUser = userJson ? JSON.parse(userJson) : null;

    this.dataService.getRoles().subscribe(roles => {
      this.roles = roles.map(r => r.name);
    });
    this.departments = this.dataService.getDepartments();

    this.dataService.userPermissions$.subscribe(perms => {
      if (perms) {
        this.displayedColumns = this.dataService.TABLE_COLUMNS.filter((col) => {
          if (col === 'select' && !perms.deleteUsers) return false;
          if (col === 'actions' && !perms.editUsers && !perms.deleteUsers) return false;
          return true;
        });
      }
    });

    this.dataService.users$.subscribe({
      next: (users) => {
        this.dataSource.data = users;
      },
    });

    this.dataService.usersPagination$.subscribe(meta => {
      if (meta && this.dataSource.paginator) {
        this.dataSource.paginator.length = meta.total;
        this.dataSource.paginator.pageIndex = meta.page - 1;
        this.dataSource.paginator.pageSize = meta.limit;
      }
    });

    // Initial load
    this.loadUsers();

    // Debounced search logic
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.filterValues.search = val;
      if (this.dataSource.paginator) {
        this.dataSource.paginator.pageIndex = 0;
      }
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    const params: any = {
      page: this.dataSource.paginator ? this.dataSource.paginator.pageIndex + 1 : 1,
      limit: this.dataSource.paginator ? this.dataSource.paginator.pageSize : 10,
      search: this.filterValues.search,
      role: this.filterValues.role,
      department: this.filterValues.department,
      status: this.filterValues.status
    };

    if (this.sort && this.sort.active) {
      params.sort = `${this.sort.active}:${this.sort.direction || 'asc'}`;
    }

    this.dataService.refreshUsers(params);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim().toLowerCase());
  }

  onRoleFilterChange(role: string) {
    this.filterValues.role = role;
    this.loadUsers();
  }

  onDepartmentFilterChange(dept: string) {
    this.filterValues.department = dept;
    this.loadUsers();
  }

  onStatusFilterChange(status: string) {
    this.filterValues.status = status;
    this.loadUsers();
  }

  onPageChange(event: any) {
    this.loadUsers();
  }

  onSortChange(event: any) {
    if (typeof event === 'string') {
      this.currentSort = event;
      if (this.sort) {
        this.sort.active = event;
        this.sort.direction = 'asc';
      }
    }
    this.loadUsers();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.fullName}`;
  }

  editUser(user: User): void {
    const perms = this.dataService.userPermissionsSubjectValue;
    if (!perms?.editUsers) {
      this.dataService.showNotification('You do not have permission to edit users.', 'error');
      return;
    }
    this.router.navigate(['/edit-user', user._id]);
  }

  deleteUser(id: string): void {
    const perms = this.dataService.userPermissionsSubjectValue;
    if (!perms?.deleteUsers) {
      this.dataService.showNotification('You do not have permission to delete users.', 'error');
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
      },
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dataService.deleteUser(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('User deleted successfully!', 'Close', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
              });
              this.selection.clear();
            }
          },
          error: (err) =>
            this.snackBar.open('Failed to delete user.', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }),
        });
      }
    });
  }

  deleteSelectedUsers(): void {
    const perms = this.dataService.userPermissionsSubjectValue;
    if (!perms?.deleteUsers) {
      this.dataService.showNotification('You do not have permission to delete users.', 'error');
      return;
    }
    const selectedIds = this.selection.selected
      .map((u) => u._id)
      .filter((id) => id !== undefined) as string[];

    if (selectedIds.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Multiple Users',
        message: `Are you sure you want to delete ${selectedIds.length} selected users? This action cannot be undone.`,
      },
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dataService.deleteMultipleUsers(selectedIds).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open(`${res.deletedCount} users deleted successfully!`, 'Close', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
              });
              this.selection.clear();
            }
          },
          error: (err) =>
            this.snackBar.open('Failed to delete selected users.', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }),
        });
      }
    });
  }
}
