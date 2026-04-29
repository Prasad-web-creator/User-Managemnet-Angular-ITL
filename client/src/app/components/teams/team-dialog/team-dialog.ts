import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DataService, User, Team } from '../../../services/data.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-team-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './team-dialog.html',
  styleUrl: './team-dialog.scss'
})
export class TeamDialogComponent implements OnInit {
  teamForm: FormGroup;
  isEditMode: boolean;
  users: User[] = [];
  projectManagers: User[] = [];
  hasProjectManagers: boolean = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TeamDialogComponent>,
    private dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: Team | null
  ) {
    this.isEditMode = !!data;
    
    const leaderId = data?.leader ? (typeof data.leader === 'string' ? data.leader : data.leader._id) : '';
    const projectManagerId = data?.projectManager ? (typeof data.projectManager === 'string' ? data.projectManager : data.projectManager._id) : '';
    const memberIds = data?.members ? data.members.map(m => typeof m === 'string' ? m : m._id) : [];

    this.teamForm = this.fb.group({
      name: [data?.name || '', [Validators.required, Validators.minLength(2)]],
      projectName: [data?.projectName || '', Validators.required],
      projectManager: [projectManagerId, Validators.required],
      leader: [leaderId, Validators.required],
      members: [memberIds]
    });
  }

  ngOnInit() {
    combineLatest([
      this.dataService.users$,
      this.dataService.teams$
    ]).subscribe(([allUsers, teams]: [User[], Team[]]) => {
      const assignedUserIds = new Set<string>();
      
      teams.forEach((team: Team) => {
        // Skip current team if we are editing it
        if (this.data && this.data._id === team._id) {
          return;
        }
        
        if (team.leader) {
          assignedUserIds.add(typeof team.leader === 'string' ? team.leader : team.leader._id!);
        }
        
        if (team.members && team.members.length > 0) {
          team.members.forEach((member: User | string) => {
            assignedUserIds.add(typeof member === 'string' ? member : member._id!);
          });
        }
      });

      this.projectManagers = allUsers.filter((user: User) => user.role && /project\s*manager/i.test(user.role));
      
      // The users list for Leader/Members should ONLY include 'Employee' role
      this.users = allUsers.filter((user: User) => 
        !assignedUserIds.has(user._id!) && 
        user.role?.toLowerCase() === 'employee'
      );
      
      this.hasProjectManagers = this.projectManagers.length > 0;
    });
  }

  get leaderCandidates(): User[] {
    const memberIds: string[] = this.teamForm.get('members')?.value || [];
    return this.users.filter(u => !memberIds.includes(u._id!));
  }

  get memberCandidates(): User[] {
    const leaderId = this.teamForm.get('leader')?.value;
    return this.users.filter(u => u._id !== leaderId);
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      this.dialogRef.close(this.teamForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
