import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

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
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog';

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
export class UsersComponent implements OnInit {
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = [];
  selection = new SelectionModel<User>(true, []);
  currentSort = '';
  currentUser: any;

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.dataSource.paginator = mp;
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.dataSource.sort = ms;
    this.sort = ms;
  }

  // To keep compatibility with existing methods
  sort!: MatSort;

  constructor(
    public dataService: DataService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }

    this.displayedColumns = this.dataService.TABLE_COLUMNS.filter((col) => {
      if (!this.isAdmin() && (col === 'select' || col === 'actions')) {
        return false;
      }
      return true;
    });

    this.dataService.users$.subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.cdr.detectChanges();
      },
    });

    this.dataService.refreshUsers();
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSortChange(column: string) {
    if (!this.sort) return;
    this.currentSort = column;
    const sortState: Sort = { active: column, direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);

    // Explicitly tell the data source to sort
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
    }
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
    if (!this.isAdmin()) return;
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '500px',
      data: { ...user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && user._id) {
        this.dataService.updateUser(user._id, result).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('User updated successfully!', 'Close', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
              });
            }
          },
          error: (err) => {
            console.error('Error updating user:', err);
            this.snackBar.open('Failed to update user.', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }

  deleteUser(id: string): void {
    if (!this.isAdmin()) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
      },
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
    if (!this.isAdmin()) return;
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
