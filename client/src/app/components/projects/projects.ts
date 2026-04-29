import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService, Team, User } from '../../services/data.service';
import { map } from 'rxjs/operators';

import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonModule,
    MatPaginatorModule
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProjectsComponent implements OnInit {
  private dataService = inject(DataService);
  
  dataSource = new MatTableDataSource<Team>([]);
  displayedColumns: string[] = ['expand', 'projectName', 'teamName', 'projectManager', 'leader', 'membersCount', 'status'];
  expandedElement: Team | null = null;
  currentUser: any;
  loading$ = this.dataService.loading$;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }

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
      this.loadProjects();
    });
  }

  loadProjects() {
    if (!this.currentUser) return;
    
    const params: any = {
      page: this.paginator ? this.paginator.pageIndex + 1 : 1,
      limit: this.paginator ? this.paginator.pageSize : 10,
      involvedUser: this.currentUser._id
    };

    this.dataService.refreshTeams(params);
  }

  onPageChange(event: any) {
    this.loadProjects();
  }

  public isUserMatch(user: User | string | undefined, currentUserId: string): boolean {
    if (!user) return false;
    if (typeof user === 'string') return user === currentUserId;
    return user._id === currentUserId;
  }

  getUserName(user: User | string | undefined): string {
    if (!user) return 'N/A';
    if (typeof user === 'string') return user;
    return user.fullName || user.username || 'Unknown';
  }
  
  getMyTask(team: Team): string {
    if (!this.currentUser || !team.tasks) return 'No Task Assigned';
    const userTask = team.tasks.find(t => this.isUserMatch(t.user, this.currentUser._id));
    return userTask ? userTask.taskName : 'No Task Assigned';
  }

  isPM(team: Team): boolean {
    if (!this.currentUser) return false;
    return this.isUserMatch(team.projectManager, this.currentUser._id);
  }

  isLeader(team: Team): boolean {
    if (!this.currentUser) return false;
    return this.isUserMatch(team.leader, this.currentUser._id);
  }

  isMember(team: Team): boolean {
    if (!this.currentUser || !team.members) return false;
    return team.members.some(m => this.isUserMatch(m, this.currentUser._id));
  }

  canExpand(team: Team): boolean {
    return this.isPM(team) || this.isLeader(team) || this.isMember(team);
  }
}
