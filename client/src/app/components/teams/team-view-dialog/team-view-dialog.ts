import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Team, User } from '../../../services/data.service';

@Component({
  selector: 'app-team-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './team-view-dialog.html',
  styleUrl: './team-view-dialog.scss'
})
export class TeamViewDialogComponent {
  team: Team;

  constructor(
    private dialogRef: MatDialogRef<TeamViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Team
  ) {
    this.team = data;
  }

  getUserName(user: User | string | undefined): string {
    if (!user) return 'N/A';
    if (typeof user === 'string') return user;
    return user.fullName || user.username || 'Unknown User';
  }

  getUserAvatar(user: User | string | undefined): string {
    const name = this.getUserName(user);
    return name.charAt(0).toUpperCase();
  }

  getUserId(user: User | string | undefined): string | undefined {
    if (!user) return undefined;
    if (typeof user === 'string') return user;
    return user._id;
  }

  getTaskForUser(user: User | string | undefined): string {
    const userId = this.getUserId(user);
    if (!userId) return 'No task assigned';
    const task = this.team.tasks?.find(t => {
      const tUserId = typeof t.user === 'string' ? t.user : t.user?._id;
      return tUserId === userId;
    });
    return task?.taskName || 'No task assigned';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
