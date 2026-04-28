import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DataService, Role } from '../../services/data.service';
import { RoleDialogComponent } from './role-dialog/role-dialog';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class RolesComponent implements OnInit {
  private dataService = inject(DataService);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<Role>([]);
  displayedColumns: string[] = ['name', 'description', 'permissions', 'actions'];
  loading$ = this.dataService.loading$;
  permissions$ = this.dataService.userPermissions$;

  constructor() {}

  ngOnInit(): void {
    this.dataService.userPermissions$.subscribe(perms => {
      if (perms) {
        this.displayedColumns = ['name', 'description', 'permissions'];
        if (perms.roles) {
          this.displayedColumns.push('actions');
        }
      }
    });

    // Use a small delay to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.dataService.getRoles().subscribe(roles => {
        this.dataSource.data = roles;
      });
    });
  }

  openRoleDialog(role?: Role): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '500px',
      data: role ? JSON.parse(JSON.stringify(role)) : null,
      disableClose: true,
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (role && role._id) {
          this.dataService.updateRole(role._id, result).subscribe();
        } else {
          this.dataService.addRole(result).subscribe();
        }
      }
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      if (role._id) {
        this.dataService.deleteRole(role._id).subscribe();
      }
    }
  }
}
