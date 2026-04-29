import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService, Team } from '../../services/data.service';
import { TeamDialogComponent } from './team-dialog/team-dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog';
import { AssignTaskDialogComponent } from './assign-task-dialog/assign-task-dialog';
import { TeamViewDialogComponent } from './team-view-dialog/team-view-dialog';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-teams',
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
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './teams.html',
  styleUrl: './teams.scss'
})
export class TeamsComponent implements OnInit, OnDestroy {
  public dataService = inject(DataService);
  private dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  dataSource = new MatTableDataSource<Team>([]);
  selection = new SelectionModel<Team>(true, []);
  displayedColumns: string[] = ['select', 'name', 'projectName', 'projectManager', 'leader', 'members', 'actions'];
  loading$ = this.dataService.loading$;
  permissions$ = this.dataService.userPermissions$;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm: string = '';

  ngOnInit(): void {
    // Start fetching users to populate dropdowns in dialog
    this.dataService.refreshUsers();
    
    this.dataService.teams$.subscribe(teams => {
      this.dataSource.data = teams;
    });

    this.dataService.teamsPagination$.subscribe(meta => {
      if (meta && this.paginator) {
        this.paginator.length = meta.total;
        this.paginator.pageIndex = meta.page - 1;
        this.paginator.pageSize = meta.limit;
      }
    });

    // Initial load
    setTimeout(() => {
      this.loadTeams();
    });

    // Debounced search logic
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.searchTerm = val;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadTeams();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTeams() {
    const params: any = {
      page: this.paginator ? this.paginator.pageIndex + 1 : 1,
      limit: this.paginator ? this.paginator.pageSize : 10,
      search: this.searchTerm
    };

    if (this.sort && this.sort.active) {
      params.sort = `${this.sort.active}:${this.sort.direction || 'asc'}`;
    }

    this.dataService.refreshTeams(params);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue.trim().toLowerCase());
  }

  onSortChange(sort: Sort) {
    this.loadTeams();
  }

  onPageChange(event: any) {
    this.loadTeams();
  }

  openTeamDialog(team?: Team): void {
    const dialogRef = this.dialog.open(TeamDialogComponent, {
      width: '500px',
      data: team ? JSON.parse(JSON.stringify(team)) : null,
      disableClose: true,
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (team && team._id) {
          this.dataService.updateTeam(team._id, result).subscribe();
        } else {
          this.dataService.addTeam(result).subscribe();
        }
      }
    });
  }

  public openAssignTaskDialog(team: Team): void {
    console.log('Opening task assignment for team:', team.name);
    const dialogRef = this.dialog.open(AssignTaskDialogComponent, {
      width: '600px',
      data: team,
      disableClose: false,
      backdropClass: 'blur-backdrop',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(tasks => {
      if (tasks && team._id) {
        this.dataService.updateTeam(team._id, { tasks }).subscribe({
          next: () => this.dataService.showNotification('Tasks assigned successfully', 'success'),
          error: (err) => this.dataService.showNotification('Failed to assign tasks', 'error')
        });
      }
    });
  }

  openTeamViewDialog(team: Team): void {
    this.dialog.open(TeamViewDialogComponent, {
      width: '700px',
      data: team,
      backdropClass: 'blur-backdrop'
    });
  }

  deleteTeam(team: Team): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Team',
        message: `Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`,
      },
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && team._id) {
        this.dataService.deleteTeam(team._id).subscribe();
      }
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  deleteSelectedTeams(): void {
    const selectedCount = this.selection.selected.length;
    if (selectedCount === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Multiple Teams',
        message: `Are you sure you want to delete ${selectedCount} selected teams? This action cannot be undone.`,
      },
      backdropClass: 'blur-backdrop'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const teamIds = this.selection.selected.map(team => team._id as string);
        this.dataService.deleteMultipleTeams(teamIds).subscribe({
          next: () => this.selection.clear()
        });
      }
    });
  }
}
